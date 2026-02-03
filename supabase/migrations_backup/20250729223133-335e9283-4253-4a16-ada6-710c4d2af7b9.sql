-- Add RLS policies for super_admin access to key tables

-- Allow super_admin to view all profiles
CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'));

-- Allow super_admin to view all user_roles
CREATE POLICY "Super admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'));

-- Allow super_admin to manage staff_invitations
CREATE POLICY "Super admins can manage staff invitations" 
ON public.staff_invitations 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Allow super_admin to view all safety_alerts
CREATE POLICY "Super admins can view all safety alerts" 
ON public.safety_alerts 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'));

-- Allow super_admin to view all marketplace_items
CREATE POLICY "Super admins can view all marketplace items" 
ON public.marketplace_items 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'));

-- Allow super_admin to view all promotions
CREATE POLICY "Super admins can view all promotions" 
ON public.promotions 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'));

-- Allow super_admin to view all content_reports
CREATE POLICY "Super admins can view all content reports" 
ON public.content_reports 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Allow super_admin to view all businesses
CREATE POLICY "Super admins can view all businesses" 
ON public.businesses 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'));