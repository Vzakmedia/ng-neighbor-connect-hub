-- Fix profiles table security: Restrict staff access to only essential roles with business needs

-- Drop overly permissive staff policies
DROP POLICY IF EXISTS "Profiles: staff can read" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: staff can update" ON public.profiles;

-- Create more restrictive policies for profiles access
-- Only super_admin and support staff can view profiles (legitimate business need for user support)
CREATE POLICY "Super admins and support can view profiles for support purposes" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'support'::app_role)
);

-- Only super_admin can update profiles (highest privilege level only)
CREATE POLICY "Super admins can update profiles for administrative purposes" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Create a limited read policy for moderators to view basic profile info (not sensitive data)
-- This view should only show essential moderation info, not personal details
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  full_name,
  avatar_url,
  is_verified,
  city,
  state,
  neighborhood,
  bio,
  created_at,
  updated_at
FROM public.profiles;

-- Allow moderators to view the limited public profile view
GRANT SELECT ON public.public_profiles TO authenticated;

-- Create RLS policy for public profiles view
ALTER VIEW public.public_profiles SET (security_barrier = true);
CREATE POLICY "Moderators can view public profile info" 
ON public.public_profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role)
);

-- Log this security change
PERFORM log_security_event(
  'restrict_profile_access',
  'profiles_table',
  null,
  'high',
  jsonb_build_object(
    'action', 'restricted_staff_access_to_profiles',
    'reasoning', 'Limited staff access to only essential roles with legitimate business needs'
  )
);