-- Update the app_role enum to include all staff roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';

-- Create staff_permissions table to define what each role can do
CREATE TABLE IF NOT EXISTS public.staff_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role app_role NOT NULL,
    permission_name TEXT NOT NULL,
    permission_description TEXT,
    can_read BOOLEAN DEFAULT false,
    can_write BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(role, permission_name)
);

-- Enable RLS on staff_permissions
ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;

-- Create policy for staff_permissions
CREATE POLICY "Staff can view permissions for their role" 
ON public.staff_permissions 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND user_roles.role = staff_permissions.role
    )
    OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Super admins can manage all permissions
CREATE POLICY "Super admins can manage all permissions" 
ON public.staff_permissions 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Insert default permissions for each role
INSERT INTO public.staff_permissions (role, permission_name, permission_description, can_read, can_write, can_delete) VALUES
-- Super Admin - Full access to everything
('super_admin', 'users', 'Manage all users and their roles', true, true, true),
('super_admin', 'emergency_alerts', 'Manage emergency alerts and panic situations', true, true, true),
('super_admin', 'marketplace', 'Manage marketplace items and transactions', true, true, true),
('super_admin', 'promotions', 'Manage promotional content and campaigns', true, true, true),
('super_admin', 'content_moderation', 'Moderate all content and handle reports', true, true, true),
('super_admin', 'business_verification', 'Verify and manage businesses', true, true, true),
('super_admin', 'automations', 'Configure platform automations', true, true, true),
('super_admin', 'system_settings', 'Manage system-wide configurations', true, true, true),
('super_admin', 'analytics', 'Access all analytics and reports', true, true, false),
('super_admin', 'staff_management', 'Manage staff roles and permissions', true, true, true),

-- Moderator - Content moderation focus
('moderator', 'content_moderation', 'Moderate community content and handle reports', true, true, true),
('moderator', 'users', 'View and moderate user accounts', true, true, false),
('moderator', 'emergency_alerts', 'Monitor and respond to emergency alerts', true, true, false),
('moderator', 'marketplace', 'Moderate marketplace listings', true, true, false),
('moderator', 'analytics', 'View moderation analytics', true, false, false),

-- Manager - Business operations focus
('manager', 'business_verification', 'Manage business verification process', true, true, false),
('manager', 'promotions', 'Manage promotional campaigns', true, true, true),
('manager', 'marketplace', 'Oversee marketplace operations', true, true, false),
('manager', 'analytics', 'Access business analytics and reports', true, false, false),
('manager', 'users', 'View user statistics and trends', true, false, false),

-- Support - User support focus
('support', 'users', 'Assist users with account issues', true, true, false),
('support', 'emergency_alerts', 'Respond to emergency situations', true, true, false),
('support', 'content_moderation', 'Handle user reports and complaints', true, true, false),
('support', 'marketplace', 'Help with marketplace disputes', true, false, false),

-- Staff - Basic operations
('staff', 'users', 'View basic user information', true, false, false),
('staff', 'content_moderation', 'Flag inappropriate content', true, true, false),
('staff', 'marketplace', 'Monitor marketplace activity', true, false, false);

-- Create activity_logs table to track staff actions
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for activity_logs
CREATE POLICY "Users can view their own activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Super admins and managers can view all activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
);

-- Update has_role function to include super_admin check
CREATE OR REPLACE FUNCTION public.has_staff_permission(_user_id uuid, _permission text, _access_type text DEFAULT 'read')
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.staff_permissions sp ON ur.role = sp.role
    WHERE ur.user_id = _user_id
      AND sp.permission_name = _permission
      AND (
        (_access_type = 'read' AND sp.can_read = true) OR
        (_access_type = 'write' AND sp.can_write = true) OR
        (_access_type = 'delete' AND sp.can_delete = true)
      )
  )
$$;

-- Function to log staff activities
CREATE OR REPLACE FUNCTION public.log_staff_activity(
    _action_type text,
    _resource_type text,
    _resource_id uuid DEFAULT NULL,
    _details jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.activity_logs (
        user_id,
        action_type,
        resource_type,
        resource_id,
        details
    ) VALUES (
        auth.uid(),
        _action_type,
        _resource_type,
        _resource_id,
        _details
    );
END;
$$;