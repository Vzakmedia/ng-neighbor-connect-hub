-- Fix remaining security warnings for functions missing search_path

CREATE OR REPLACE FUNCTION public.get_staff_management_stats()
RETURNS TABLE(
  total_staff bigint,
  active_staff_today bigint,
  pending_invitations bigint,
  staff_by_role jsonb,
  recent_staff_activities jsonb,
  top_staff_performers jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.user_roles WHERE role IN ('admin', 'moderator', 'manager', 'support', 'staff'))::BIGINT as total_staff,
    (SELECT COUNT(DISTINCT al.user_id) 
     FROM public.activity_logs al
     JOIN public.user_roles ur ON al.user_id = ur.user_id
     WHERE al.created_at::DATE = CURRENT_DATE 
     AND ur.role IN ('admin', 'moderator', 'manager', 'support', 'staff'))::BIGINT as active_staff_today,
    (SELECT COUNT(*) FROM public.staff_invitations WHERE status = 'pending' AND expires_at > now())::BIGINT as pending_invitations,
    (
      SELECT jsonb_object_agg(role, role_count)
      FROM (
        SELECT role, COUNT(*) as role_count
        FROM public.user_roles
        WHERE role IN ('admin', 'moderator', 'manager', 'support', 'staff')
        GROUP BY role
      ) staff_roles
    ) as staff_by_role,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'user_id', al.user_id,
          'action_type', al.action_type,
          'resource_type', al.resource_type,
          'created_at', al.created_at,
          'role', ur.role
        )
      )
      FROM public.activity_logs al
      JOIN public.user_roles ur ON al.user_id = ur.user_id
      WHERE al.created_at >= now() - interval '24 hours'
      AND ur.role IN ('admin', 'moderator', 'manager', 'support', 'staff')
      ORDER BY al.created_at DESC
      LIMIT 20
    ) as recent_staff_activities,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'user_id', user_id,
          'role', role,
          'activity_count', activity_count
        )
      )
      FROM (
        SELECT 
          al.user_id,
          ur.role,
          COUNT(*) as activity_count
        FROM public.activity_logs al
        JOIN public.user_roles ur ON al.user_id = ur.user_id
        WHERE al.created_at >= CURRENT_DATE - 7
        AND ur.role IN ('admin', 'moderator', 'manager', 'support', 'staff')
        GROUP BY al.user_id, ur.role
        ORDER BY activity_count DESC
        LIMIT 10
      ) top_performers
    ) as top_staff_performers;
END;
$$;

CREATE OR REPLACE FUNCTION public.bulk_moderate_content(
  content_ids uuid[],
  content_type text,
  action_type text, -- 'approve', 'reject', 'delete'
  rejection_reason text DEFAULT NULL
)
RETURNS TABLE(
  processed_count bigint,
  success_count bigint,
  error_count bigint,
  errors jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  processed bigint := 0;
  success bigint := 0;
  errors_array jsonb := '[]'::jsonb;
  content_id uuid;
BEGIN
  -- Check if user has moderation permissions
  IF NOT has_staff_permission(auth.uid(), 'content_moderation', 'write') THEN
    RAISE EXCEPTION 'Insufficient permissions for content moderation';
  END IF;

  FOREACH content_id IN ARRAY content_ids
  LOOP
    processed := processed + 1;
    
    BEGIN
      IF content_type = 'community_post' THEN
        UPDATE public.community_posts
        SET 
          approval_status = CASE WHEN action_type = 'approve' THEN 'approved' ELSE 'rejected' END,
          approved_by = CASE WHEN action_type = 'approve' THEN auth.uid() ELSE NULL END,
          approved_at = CASE WHEN action_type = 'approve' THEN now() ELSE NULL END
        WHERE id = content_id;
        
      ELSIF content_type = 'service' THEN
        UPDATE public.services
        SET 
          approval_status = CASE WHEN action_type = 'approve' THEN 'approved' ELSE 'rejected' END,
          approved_by = CASE WHEN action_type = 'approve' THEN auth.uid() ELSE NULL END,
          approved_at = CASE WHEN action_type = 'approve' THEN now() ELSE NULL END,
          rejection_reason = CASE WHEN action_type = 'reject' THEN rejection_reason ELSE NULL END
        WHERE id = content_id;
        
      ELSIF content_type = 'marketplace_item' THEN
        UPDATE public.marketplace_items
        SET 
          approval_status = CASE WHEN action_type = 'approve' THEN 'approved' ELSE 'rejected' END,
          approved_by = CASE WHEN action_type = 'approve' THEN auth.uid() ELSE NULL END,
          approved_at = CASE WHEN action_type = 'approve' THEN now() ELSE NULL END,
          rejection_reason = CASE WHEN action_type = 'reject' THEN rejection_reason ELSE NULL END
        WHERE id = content_id;
        
      ELSIF content_type = 'advertisement_campaign' THEN
        UPDATE public.advertisement_campaigns
        SET 
          approval_status = CASE WHEN action_type = 'approve' THEN 'approved' ELSE 'rejected' END,
          approved_by = CASE WHEN action_type = 'approve' THEN auth.uid() ELSE NULL END,
          approved_at = CASE WHEN action_type = 'approve' THEN now() ELSE NULL END,
          rejection_reason = CASE WHEN action_type = 'reject' THEN rejection_reason ELSE NULL END
        WHERE id = content_id;
      END IF;
      
      success := success + 1;
      
      -- Log the moderation action
      PERFORM log_staff_activity(
        'bulk_moderate_' || action_type,
        content_type,
        content_id,
        jsonb_build_object('rejection_reason', rejection_reason)
      );
      
    EXCEPTION WHEN OTHERS THEN
      errors_array := errors_array || jsonb_build_object(
        'content_id', content_id,
        'error', SQLERRM
      );
    END;
  END LOOP;

  RETURN QUERY
  SELECT 
    processed,
    success,
    processed - success as error_count,
    errors_array;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_business_verification_queue()
RETURNS TABLE(
  business_id uuid,
  business_name text,
  user_id uuid,
  category text,
  verification_status text,
  created_at timestamp with time zone,
  verification_documents jsonb,
  business_license text,
  tax_id_number text,
  email text,
  phone text,
  priority_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.business_name,
    b.user_id,
    b.category,
    b.verification_status,
    b.created_at,
    b.verification_documents,
    b.business_license,
    b.tax_id_number,
    b.email,
    b.phone,
    -- Priority score based on completeness and age
    (
      CASE WHEN b.business_license IS NOT NULL THEN 20 ELSE 0 END +
      CASE WHEN b.tax_id_number IS NOT NULL THEN 20 ELSE 0 END +
      CASE WHEN jsonb_array_length(b.verification_documents) > 0 THEN 30 ELSE 0 END +
      CASE WHEN b.email IS NOT NULL THEN 10 ELSE 0 END +
      CASE WHEN b.phone IS NOT NULL THEN 10 ELSE 0 END +
      -- Age bonus (older requests get higher priority)
      GREATEST(0, 10 - EXTRACT(days FROM now() - b.created_at))
    ) as priority_score
  FROM public.businesses b
  WHERE b.verification_status = 'pending'
  ORDER BY priority_score DESC, b.created_at ASC;
END;
$$;