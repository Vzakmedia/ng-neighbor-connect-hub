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