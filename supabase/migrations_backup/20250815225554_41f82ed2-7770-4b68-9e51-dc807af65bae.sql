-- First, let's check what policies exist and then create proper restrictions

-- Remove any existing overly permissive policies on safety_center_settings
DROP POLICY IF EXISTS "Anyone can view safety center settings" ON public.safety_center_settings;
DROP POLICY IF EXISTS "Public can view safety center settings" ON public.safety_center_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.safety_center_settings;

-- Create restricted policies for safety_center_settings
-- Only allow authenticated users to view non-sensitive default settings
CREATE POLICY "Authenticated users can view default safety settings"
ON public.safety_center_settings
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND setting_category IN ('default_preferences', 'public_settings')
);

-- Only allow super admins and admins to view all safety center settings
CREATE POLICY "Admins can view all safety center settings"
ON public.safety_center_settings
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only allow super admins and admins to manage safety center settings
CREATE POLICY "Admins can manage safety center settings"
ON public.safety_center_settings
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Remove any existing overly permissive policies on notification_templates
DROP POLICY IF EXISTS "Anyone can view notification templates" ON public.notification_templates;
DROP POLICY IF EXISTS "Public can view notification templates" ON public.notification_templates;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.notification_templates;

-- Create restricted policies for notification_templates
-- Only allow super admins, admins, and support staff to view notification templates
CREATE POLICY "Staff can view notification templates"
ON public.notification_templates
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'support'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role)
);

-- Only allow super admins and admins to manage notification templates
CREATE POLICY "Admins can manage notification templates"
ON public.notification_templates
FOR ALL
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Enable RLS on both tables if not already enabled
ALTER TABLE public.safety_center_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;