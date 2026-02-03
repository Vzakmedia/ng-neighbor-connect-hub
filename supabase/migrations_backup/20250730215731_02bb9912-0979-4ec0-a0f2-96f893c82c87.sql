-- Add RLS policies to staff_invitations table (Critical Fix)
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

-- Policy for viewing invitations (only admins and the inviter can view)
CREATE POLICY "Admins and inviters can view staff invitations" 
ON public.staff_invitations 
FOR SELECT 
USING (
  has_staff_permission(auth.uid(), 'user_management', 'read') OR
  auth.uid() = invited_by
);

-- Policy for creating invitations (only users with user_management permission)
CREATE POLICY "Authorized users can create staff invitations" 
ON public.staff_invitations 
FOR INSERT 
WITH CHECK (
  has_staff_permission(auth.uid(), 'user_management', 'write') AND
  auth.uid() = invited_by
);

-- Policy for updating invitations (only admins and original inviter)
CREATE POLICY "Authorized users can update staff invitations" 
ON public.staff_invitations 
FOR UPDATE 
USING (
  has_staff_permission(auth.uid(), 'user_management', 'write') OR
  auth.uid() = invited_by
);

-- Policy for deleting invitations (only super admins)
CREATE POLICY "Super admins can delete staff invitations" 
ON public.staff_invitations 
FOR DELETE 
USING (has_role(auth.uid(), 'super_admin'));

-- Strengthen role management security
-- Prevent users from modifying their own roles
CREATE OR REPLACE FUNCTION public.prevent_self_role_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent users from modifying their own roles unless they're super admin
  IF TG_OP = 'UPDATE' AND OLD.user_id = auth.uid() THEN
    IF NOT has_role(auth.uid(), 'super_admin') THEN
      RAISE EXCEPTION 'Users cannot modify their own roles';
    END IF;
  END IF;
  
  -- Only allow role changes by authorized users
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    IF NOT has_staff_permission(auth.uid(), 'user_management', 'write') THEN
      RAISE EXCEPTION 'Insufficient permissions to manage user roles';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to user_roles table
DROP TRIGGER IF EXISTS prevent_self_role_modification_trigger ON public.user_roles;
CREATE TRIGGER prevent_self_role_modification_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION prevent_self_role_modification();

-- Add comprehensive input validation function
CREATE OR REPLACE FUNCTION public.validate_content_input(content_text text, max_length integer DEFAULT 10000)
RETURNS boolean AS $$
BEGIN
  -- Check length
  IF LENGTH(content_text) > max_length THEN
    RAISE EXCEPTION 'Content exceeds maximum length of % characters', max_length;
  END IF;
  
  -- Check for malicious content patterns
  IF content_text ~* '<script|javascript:|on\w+\s*=|<iframe|<object|<embed' THEN
    RAISE EXCEPTION 'Content contains potentially malicious code';
  END IF;
  
  -- Check for SQL injection patterns
  IF content_text ~* '(union\s+select|drop\s+table|delete\s+from|insert\s+into|update\s+set)' THEN
    RAISE EXCEPTION 'Content contains potentially malicious SQL patterns';
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add validation triggers to content tables
CREATE OR REPLACE FUNCTION public.validate_community_post_content()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM validate_content_input(NEW.content, 10000);
  IF NEW.title IS NOT NULL THEN
    PERFORM validate_content_input(NEW.title, 200);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS validate_community_post_trigger ON public.community_posts;
CREATE TRIGGER validate_community_post_trigger
  BEFORE INSERT OR UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION validate_community_post_content();

-- Add security audit logging
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  risk_level TEXT DEFAULT 'low',
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view security audit logs
CREATE POLICY "Admins can view security audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- System can insert audit logs
CREATE POLICY "System can insert security audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  _action_type text,
  _resource_type text,
  _resource_id uuid DEFAULT NULL,
  _risk_level text DEFAULT 'low',
  _details jsonb DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action_type,
    resource_type,
    resource_id,
    risk_level,
    details
  ) VALUES (
    auth.uid(),
    _action_type,
    _resource_type,
    _resource_id,
    _risk_level,
    _details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;