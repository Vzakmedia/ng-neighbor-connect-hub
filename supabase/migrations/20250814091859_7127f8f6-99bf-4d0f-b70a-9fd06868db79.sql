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

-- Drop the table if it exists (it's actually a table not a view based on the schema)
DROP TABLE IF EXISTS public.public_profiles CASCADE;

-- Create a limited read view for moderators to view basic profile info (not sensitive data)
CREATE VIEW public.public_profiles AS
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

-- Enable RLS on the view
ALTER VIEW public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for public profiles view
CREATE POLICY "Moderators can view public profile info" 
ON public.public_profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role)
);

-- Grant access to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;