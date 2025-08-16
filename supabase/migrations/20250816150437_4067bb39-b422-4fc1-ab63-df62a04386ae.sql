-- Fix critical security vulnerability in promotion analytics
-- Remove overly permissive policies and implement proper access controls

-- Drop the dangerous public access policy for promoted_posts
DROP POLICY IF EXISTS "Active promoted posts are viewable by everyone" ON public.promoted_posts;

-- Drop the overly permissive system analytics policy  
DROP POLICY IF EXISTS "System can update analytics" ON public.promotion_analytics;

-- Drop the overly permissive impressions policy
DROP POLICY IF EXISTS "System can log impressions" ON public.promotion_impressions;

-- Create secure policy for promoted_posts - restrict to campaign owners and admins only
CREATE POLICY "Campaign owners and admins can view promoted posts" ON public.promoted_posts
FOR SELECT 
USING (
  -- Campaign owners can see their own promoted posts
  EXISTS (
    SELECT 1 FROM public.promotion_campaigns pc 
    WHERE pc.id = promoted_posts.campaign_id 
    AND pc.user_id = auth.uid()
  )
  OR
  -- Admins can see all promoted posts
  has_role(auth.uid(), 'admin'::app_role)
  OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Create restricted policy for promotion_analytics - only system and owners
CREATE POLICY "Restricted analytics access" ON public.promotion_analytics
FOR INSERT 
WITH CHECK (
  -- Only allow system to insert analytics data
  auth.uid() IS NULL -- System/service account insertions
  OR
  -- Or admin users for manual data entry
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create secure impressions policy with validation
CREATE POLICY "Validated impression logging" ON public.promotion_impressions
FOR INSERT 
WITH CHECK (
  promoted_post_id IS NOT NULL 
  AND impression_type IN ('view', 'click', 'conversion')
);

-- Create audit function to log access to sensitive promotion data
CREATE OR REPLACE FUNCTION public.log_promotion_access(
  _table_name text,
  _record_id uuid,
  _access_type text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action_type,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    _access_type,
    _table_name,
    _record_id,
    jsonb_build_object(
      'timestamp', now(),
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent'
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Don't let audit logging failure break the main operation
    NULL;
END;
$$;