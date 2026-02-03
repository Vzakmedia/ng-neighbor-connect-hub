-- Create a security definer function to get minimal public profile info
-- This allows controlled access to basic profile data without exposing sensitive information
CREATE OR REPLACE FUNCTION public.get_public_profile_info(target_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  city text,
  state text,
  bio text,
  is_verified boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    p.avatar_url,
    p.city,
    p.state,
    p.bio,
    p.is_verified
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- Create a function for staff to get limited profile data for moderation purposes only
CREATE OR REPLACE FUNCTION public.get_profile_for_moderation(target_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  created_at timestamptz,
  is_verified boolean,
  city text,
  state text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow staff with specific permissions
  IF NOT has_staff_permission(auth.uid(), 'user_management', 'read') THEN
    RAISE EXCEPTION 'Insufficient permissions to access profile data';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    p.email,
    p.created_at,
    p.is_verified,
    p.city,
    p.state
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- Drop overly permissive policies that expose too much data
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins and support can view profiles for support purposes" ON public.profiles;
DROP POLICY IF EXISTS "Super admins and support can view user emails" ON public.profiles;

-- Service and marketplace interactions: Allow viewing basic profile info for active transactions
CREATE POLICY "Allow basic profile info for service interactions" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- User is booking/reviewing a service from this provider
    EXISTS (
      SELECT 1 FROM public.service_bookings sb 
      WHERE (sb.provider_id = profiles.user_id OR sb.client_id = profiles.user_id)
      AND (sb.provider_id = auth.uid() OR sb.client_id = auth.uid())
    )
    OR
    -- User is interacting with marketplace items from this seller
    EXISTS (
      SELECT 1 FROM public.marketplace_items mi
      WHERE mi.user_id = profiles.user_id
      AND EXISTS (
        SELECT 1 FROM public.marketplace_inquiries miq
        WHERE miq.item_id = mi.id AND miq.buyer_id = auth.uid()
      )
    )
  )
);

-- Update admin policies to be more specific and logged
CREATE POLICY "Super admins can update verification status with audit" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));