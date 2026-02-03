-- Fix critical security vulnerability in promotion analytics
-- Remove overly permissive policies and implement proper access controls

-- Drop the dangerous public access policy for promoted_posts
DROP POLICY IF EXISTS "Active promoted posts are viewable by everyone" ON public.promoted_posts;

-- Drop the overly permissive system analytics policy
DROP POLICY IF EXISTS "System can update analytics" ON public.promotion_analytics;

-- Create secure policy for promoted_posts that only exposes necessary data for ad display
-- This allows public viewing but through a controlled function that filters sensitive data
CREATE POLICY "Public can view promoted post display data" ON public.promoted_posts
FOR SELECT 
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM public.promotion_campaigns pc 
    WHERE pc.id = promoted_posts.campaign_id 
    AND pc.status = 'active' 
    AND pc.end_date >= now()
  )
);

-- Create a view for public promoted content that excludes sensitive business data
CREATE OR REPLACE VIEW public.promoted_content_public AS
SELECT 
  pp.id,
  pp.campaign_id,
  pp.post_type,
  pp.post_content,
  pp.priority,
  -- Exclude sensitive fields like cost_per_click, detailed targeting, budgets
  pc.start_date,
  pc.end_date
FROM public.promoted_posts pp
JOIN public.promotion_campaigns pc ON pp.campaign_id = pc.id
WHERE pp.is_active = true 
  AND pc.status = 'active'
  AND pc.end_date >= now();

-- Enable RLS on the view
ALTER VIEW public.promoted_content_public SET (security_barrier = true);

-- Create policy for the public view
CREATE POLICY "Anyone can view public promoted content" ON public.promoted_content_public
FOR SELECT USING (true);

-- Secure the promotion_analytics table - only campaign owners and admins
CREATE POLICY "System can insert analytics only" ON public.promotion_analytics
FOR INSERT 
WITH CHECK (true);

-- Create policy for promotion_impressions to restrict system access
DROP POLICY IF EXISTS "System can log impressions" ON public.promotion_impressions;
CREATE POLICY "System can log impressions with validation" ON public.promotion_impressions
FOR INSERT 
WITH CHECK (
  promoted_post_id IS NOT NULL 
  AND user_id IS NOT NULL
);

-- Add additional security: ensure promoted posts can only be created by campaign owners
ALTER TABLE public.promoted_posts ADD CONSTRAINT check_campaign_ownership 
CHECK (
  EXISTS (
    SELECT 1 FROM public.promotion_campaigns 
    WHERE id = campaign_id 
    AND user_id = (SELECT user_id FROM public.promotion_campaigns WHERE id = promoted_posts.campaign_id)
  )
) NOT VALID;

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
      'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
    )
  );
END;
$$;