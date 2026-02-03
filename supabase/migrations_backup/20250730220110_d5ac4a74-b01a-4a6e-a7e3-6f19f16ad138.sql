-- Enable RLS on tables that are missing it (Critical Fix)
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.prevent_self_role_modification()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.validate_content_input(content_text text, max_length integer DEFAULT 10000)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.validate_community_post_content()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM validate_content_input(NEW.content, 10000);
  IF NEW.title IS NOT NULL THEN
    PERFORM validate_content_input(NEW.title, 200);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_security_event(
  _action_type text,
  _resource_type text,
  _resource_id uuid DEFAULT NULL,
  _risk_level text DEFAULT 'low',
  _details jsonb DEFAULT '{}'
)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;