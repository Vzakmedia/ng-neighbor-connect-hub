-- Check current RLS policies for services table and add super admin access if needed

-- Add RLS policy for super admins to view all services
CREATE POLICY "Super admins can view all services" 
ON public.services 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add RLS policy for super admins to manage all services  
CREATE POLICY "Super admins can manage all services"
ON public.services 
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));