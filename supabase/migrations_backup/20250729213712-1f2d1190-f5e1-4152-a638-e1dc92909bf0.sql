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
('staff', 'marketplace', 'Monitor marketplace activity', true, false, false)
ON CONFLICT (role, permission_name) DO NOTHING;

-- Create helper functions with proper search path
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

-- Function to get user's staff role
CREATE OR REPLACE FUNCTION public.get_user_staff_role(_user_id uuid DEFAULT NULL)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = COALESCE(_user_id, auth.uid())
  AND role IN ('super_admin', 'moderator', 'manager', 'support', 'staff')
  LIMIT 1
$$;