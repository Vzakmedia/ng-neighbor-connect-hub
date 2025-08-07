-- Admin Dashboard Database Functions

-- 1. Get comprehensive user statistics for admin dashboard
CREATE OR REPLACE FUNCTION public.get_admin_user_stats(
  start_date date DEFAULT (CURRENT_DATE - '30 days'::interval),
  end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_users bigint,
  new_users_today bigint,
  new_users_this_week bigint,
  new_users_this_month bigint,
  active_users_today bigint,
  active_users_this_week bigint,
  verified_users bigint,
  pending_verification bigint,
  banned_users bigint,
  user_growth_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.profiles)::BIGINT as total_users,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at::DATE = CURRENT_DATE)::BIGINT as new_users_today,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at::DATE >= CURRENT_DATE - 7)::BIGINT as new_users_this_week,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at::DATE >= CURRENT_DATE - 30)::BIGINT as new_users_this_month,
    (SELECT COUNT(DISTINCT user_id) FROM public.user_analytics WHERE date = CURRENT_DATE)::BIGINT as active_users_today,
    (SELECT COUNT(DISTINCT user_id) FROM public.user_analytics WHERE date >= CURRENT_DATE - 7)::BIGINT as active_users_this_week,
    (SELECT COUNT(*) FROM public.profiles WHERE email_verified = true)::BIGINT as verified_users,
    (SELECT COUNT(*) FROM public.profiles WHERE email_verified = false OR email_verified IS NULL)::BIGINT as pending_verification,
    (SELECT COUNT(*) FROM public.user_roles WHERE role = 'banned')::BIGINT as banned_users,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.profiles WHERE created_at::DATE >= CURRENT_DATE - 60 AND created_at::DATE < CURRENT_DATE - 30) > 0
      THEN (
        (SELECT COUNT(*) FROM public.profiles WHERE created_at::DATE >= CURRENT_DATE - 30)::DECIMAL /
        (SELECT COUNT(*) FROM public.profiles WHERE created_at::DATE >= CURRENT_DATE - 60 AND created_at::DATE < CURRENT_DATE - 30)::DECIMAL - 1
      ) * 100
      ELSE 0
    END as user_growth_rate;
END;
$$;

-- 2. Get content moderation queue stats
CREATE OR REPLACE FUNCTION public.get_content_moderation_stats()
RETURNS TABLE(
  pending_posts bigint,
  pending_services bigint,
  pending_marketplace_items bigint,
  pending_businesses bigint,
  pending_advertisements bigint,
  total_reports bigint,
  pending_reports bigint,
  resolved_reports_today bigint,
  flagged_content_by_type jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.community_posts WHERE approval_status = 'pending')::BIGINT as pending_posts,
    (SELECT COUNT(*) FROM public.services WHERE approval_status = 'pending')::BIGINT as pending_services,
    (SELECT COUNT(*) FROM public.marketplace_items WHERE approval_status = 'pending')::BIGINT as pending_marketplace_items,
    (SELECT COUNT(*) FROM public.businesses WHERE verification_status = 'pending')::BIGINT as pending_businesses,
    (SELECT COUNT(*) FROM public.advertisement_campaigns WHERE approval_status = 'pending')::BIGINT as pending_advertisements,
    (SELECT COUNT(*) FROM public.content_reports)::BIGINT as total_reports,
    (SELECT COUNT(*) FROM public.content_reports WHERE status = 'pending')::BIGINT as pending_reports,
    (SELECT COUNT(*) FROM public.content_reports WHERE status = 'resolved' AND reviewed_at::DATE = CURRENT_DATE)::BIGINT as resolved_reports_today,
    (
      SELECT jsonb_object_agg(content_type, report_count)
      FROM (
        SELECT content_type, COUNT(*) as report_count
        FROM public.content_reports
        WHERE status = 'pending'
        GROUP BY content_type
      ) AS report_counts
    ) as flagged_content_by_type;
END;
$$;

-- 3. Get system health and performance metrics
CREATE OR REPLACE FUNCTION public.get_system_health_metrics()
RETURNS TABLE(
  total_storage_used_mb numeric,
  active_sessions bigint,
  messages_last_hour bigint,
  posts_last_hour bigint,
  error_rate_last_hour numeric,
  database_connections bigint,
  api_requests_last_hour bigint,
  emergency_alerts_active bigint,
  system_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  last_hour timestamp := now() - interval '1 hour';
BEGIN
  RETURN QUERY
  SELECT 
    0::NUMERIC as total_storage_used_mb, -- Placeholder for storage calculation
    (SELECT COUNT(DISTINCT user_id) FROM public.user_analytics WHERE date = CURRENT_DATE)::BIGINT as active_sessions,
    (SELECT COUNT(*) FROM public.direct_messages WHERE created_at >= last_hour)::BIGINT as messages_last_hour,
    (SELECT COUNT(*) FROM public.community_posts WHERE created_at >= last_hour)::BIGINT as posts_last_hour,
    0::NUMERIC as error_rate_last_hour, -- Placeholder for error rate calculation
    5::BIGINT as database_connections, -- Placeholder for DB connections
    (
      (SELECT COUNT(*) FROM public.direct_messages WHERE created_at >= last_hour) +
      (SELECT COUNT(*) FROM public.community_posts WHERE created_at >= last_hour) +
      (SELECT COUNT(*) FROM public.comment_likes WHERE created_at >= last_hour)
    )::BIGINT as api_requests_last_hour,
    (SELECT COUNT(*) FROM public.panic_alerts WHERE is_resolved = false)::BIGINT as emergency_alerts_active,
    'healthy'::TEXT as system_status;
END;
$$;

-- 4. Get revenue analytics breakdown
CREATE OR REPLACE FUNCTION public.get_revenue_breakdown(
  start_date date DEFAULT (CURRENT_DATE - '30 days'::interval),
  end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_revenue numeric,
  ad_campaign_revenue numeric,
  promotion_revenue numeric,
  service_booking_revenue numeric,
  transaction_count bigint,
  average_transaction_value numeric,
  revenue_by_day jsonb,
  top_revenue_sources jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(
      (SELECT SUM(payment_amount) FROM public.advertisement_campaigns 
       WHERE payment_status = 'completed' 
       AND payment_completed_at::DATE BETWEEN start_date AND end_date), 0
    ) as total_revenue,
    COALESCE(
      (SELECT SUM(payment_amount) FROM public.advertisement_campaigns 
       WHERE payment_status = 'completed' 
       AND campaign_type = 'advertisement'
       AND payment_completed_at::DATE BETWEEN start_date AND end_date), 0
    ) as ad_campaign_revenue,
    COALESCE(
      (SELECT SUM(payment_amount) FROM public.advertisement_campaigns 
       WHERE payment_status = 'completed' 
       AND campaign_type = 'promotion'
       AND payment_completed_at::DATE BETWEEN start_date AND end_date), 0
    ) as promotion_revenue,
    0::NUMERIC as service_booking_revenue, -- Placeholder for service bookings
    (SELECT COUNT(*) FROM public.advertisement_campaigns 
     WHERE payment_status = 'completed' 
     AND payment_completed_at::DATE BETWEEN start_date AND end_date)::BIGINT as transaction_count,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.advertisement_campaigns 
            WHERE payment_status = 'completed' 
            AND payment_completed_at::DATE BETWEEN start_date AND end_date) > 0
      THEN (SELECT AVG(payment_amount) FROM public.advertisement_campaigns 
            WHERE payment_status = 'completed' 
            AND payment_completed_at::DATE BETWEEN start_date AND end_date)
      ELSE 0
    END as average_transaction_value,
    (
      SELECT jsonb_object_agg(revenue_date, daily_revenue)
      FROM (
        SELECT 
          payment_completed_at::DATE as revenue_date,
          SUM(payment_amount) as daily_revenue
        FROM public.advertisement_campaigns
        WHERE payment_status = 'completed'
        AND payment_completed_at::DATE BETWEEN start_date AND end_date
        GROUP BY payment_completed_at::DATE
        ORDER BY revenue_date
      ) daily_revenues
    ) as revenue_by_day,
    (
      SELECT jsonb_object_agg(campaign_type, type_revenue)
      FROM (
        SELECT 
          campaign_type,
          SUM(payment_amount) as type_revenue
        FROM public.advertisement_campaigns
        WHERE payment_status = 'completed'
        AND payment_completed_at::DATE BETWEEN start_date AND end_date
        GROUP BY campaign_type
        ORDER BY type_revenue DESC
      ) type_revenues
    ) as top_revenue_sources;
END;
$$;

-- 5. Get emergency alerts management data
CREATE OR REPLACE FUNCTION public.get_emergency_alerts_summary()
RETURNS TABLE(
  active_alerts bigint,
  resolved_alerts_today bigint,
  total_panic_alerts bigint,
  unresolved_panic_alerts bigint,
  alerts_by_type jsonb,
  recent_critical_alerts jsonb,
  response_time_avg_minutes numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.safety_alerts WHERE status = 'active')::BIGINT as active_alerts,
    (SELECT COUNT(*) FROM public.safety_alerts WHERE status = 'resolved' AND verified_at::DATE = CURRENT_DATE)::BIGINT as resolved_alerts_today,
    (SELECT COUNT(*) FROM public.panic_alerts)::BIGINT as total_panic_alerts,
    (SELECT COUNT(*) FROM public.panic_alerts WHERE is_resolved = false)::BIGINT as unresolved_panic_alerts,
    (
      SELECT jsonb_object_agg(alert_type, alert_count)
      FROM (
        SELECT alert_type, COUNT(*) as alert_count
        FROM public.safety_alerts
        WHERE status = 'active'
        GROUP BY alert_type
      ) alert_types
    ) as alerts_by_type,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'alert_type', alert_type,
          'severity', severity,
          'created_at', created_at,
          'address', address
        )
      )
      FROM public.safety_alerts
      WHERE severity = 'critical'
      AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 10
    ) as recent_critical_alerts,
    COALESCE(
      (SELECT AVG(EXTRACT(EPOCH FROM (verified_at - created_at))/60)
       FROM public.safety_alerts 
       WHERE verified_at IS NOT NULL 
       AND created_at >= CURRENT_DATE - 30), 0
    ) as response_time_avg_minutes;
END;
$$;

-- 6. Get staff activity and management stats
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

-- 7. Bulk content moderation function
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

-- 8. Get business verification queue
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