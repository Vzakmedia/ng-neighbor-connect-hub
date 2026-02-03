-- Update RLS policies for app_configuration table to allow super_admin access

-- Drop existing admin policy
DROP POLICY IF EXISTS "Admins can manage app configuration" ON public.app_configuration;

-- Create new policy for super admins and admins
CREATE POLICY "Super admins and admins can manage app configuration" 
ON public.app_configuration 
FOR ALL 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);