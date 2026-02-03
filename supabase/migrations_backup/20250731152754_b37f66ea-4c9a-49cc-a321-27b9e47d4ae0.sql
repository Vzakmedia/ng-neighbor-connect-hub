-- Fix RLS policies for super admin access to emergency alerts

-- Drop existing policies that don't include super_admin
DROP POLICY IF EXISTS "Authorized users can resolve panic alerts" ON panic_alerts;
DROP POLICY IF EXISTS "Users can view panic alerts" ON panic_alerts;

-- Recreate policies to include super_admin role
CREATE POLICY "Authorized users can resolve panic alerts" 
ON panic_alerts 
FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Users can view panic alerts" 
ON panic_alerts 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Update safety_alerts policies to include super_admin consistently
DROP POLICY IF EXISTS "Alert creators and admins can update alerts" ON public_emergency_alerts;

CREATE POLICY "Alert creators and admins can update alerts" 
ON public_emergency_alerts 
FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Update safety_alerts admin policy to include super_admin
DROP POLICY IF EXISTS "Admins can verify alerts" ON safety_alerts;

CREATE POLICY "Admins can verify alerts" 
ON safety_alerts 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);