-- Add 2FA support for users
CREATE TABLE public.user_2fa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  backup_codes TEXT[] NOT NULL DEFAULT '{}',
  enabled_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add super admin security settings
CREATE TABLE public.super_admin_security (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  allowed_ip_addresses TEXT[] NOT NULL DEFAULT '{}',
  require_session_confirmation BOOLEAN NOT NULL DEFAULT true,
  max_session_duration_hours INTEGER NOT NULL DEFAULT 8,
  require_periodic_reauth BOOLEAN NOT NULL DEFAULT true,
  reauth_interval_minutes INTEGER NOT NULL DEFAULT 60,
  last_security_check TIMESTAMP WITH TIME ZONE,
  failed_security_attempts INTEGER NOT NULL DEFAULT 0,
  last_failed_attempt TIMESTAMP WITH TIME ZONE,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add 2FA login attempts tracking
CREATE TABLE public.two_fa_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('totp', 'backup_code')),
  success BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add admin action logs for enhanced security
CREATE TABLE public.admin_action_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_user_id UUID,
  target_resource_type TEXT,
  target_resource_id UUID,
  action_details JSONB NOT NULL DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  requires_confirmation BOOLEAN NOT NULL DEFAULT false,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmation_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_fa_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_2fa
CREATE POLICY "Users can manage their own 2FA settings"
ON public.user_2fa
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS policies for super_admin_security
CREATE POLICY "Super admins can manage their own security settings"
ON public.super_admin_security
FOR ALL
USING (
  auth.uid() = user_id AND 
  has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  auth.uid() = user_id AND 
  has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Admins can view super admin security settings"
ON public.super_admin_security
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for two_fa_attempts
CREATE POLICY "Users can view their own 2FA attempts"
ON public.two_fa_attempts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can log 2FA attempts"
ON public.two_fa_attempts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all 2FA attempts"
ON public.two_fa_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS policies for admin_action_logs
CREATE POLICY "Admins can view admin action logs"
ON public.admin_action_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System can log admin actions"
ON public.admin_action_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Super admins can update confirmation status"
ON public.admin_action_logs
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Functions for 2FA and security
CREATE OR REPLACE FUNCTION public.verify_totp_code(
  _user_id UUID,
  _totp_code TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_secret TEXT;
  is_enabled BOOLEAN;
BEGIN
  -- Get user's 2FA secret and status
  SELECT secret, is_enabled INTO user_secret, is_enabled
  FROM public.user_2fa
  WHERE user_id = _user_id;
  
  IF NOT FOUND OR NOT is_enabled THEN
    RETURN FALSE;
  END IF;
  
  -- Note: Actual TOTP verification would be done in the application layer
  -- This is a placeholder for the database function
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_backup_code(
  _user_id UUID,
  _backup_code TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_codes TEXT[];
BEGIN
  -- Get user's backup codes
  SELECT backup_codes INTO user_codes
  FROM public.user_2fa
  WHERE user_id = _user_id AND is_enabled = true;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if backup code exists
  IF _backup_code = ANY(user_codes) THEN
    -- Remove used backup code
    UPDATE public.user_2fa
    SET backup_codes = array_remove(backup_codes, _backup_code),
        last_used_at = now()
    WHERE user_id = _user_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_2fa_attempt(
  _user_id UUID,
  _attempt_type TEXT,
  _success BOOLEAN,
  _ip_address INET DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.two_fa_attempts (
    user_id,
    attempt_type,
    success,
    ip_address,
    user_agent
  ) VALUES (
    _user_id,
    _attempt_type,
    _success,
    _ip_address,
    _user_agent
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_super_admin_security(
  _user_id UUID,
  _ip_address INET DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  security_settings RECORD;
  result JSONB;
BEGIN
  -- Get super admin security settings
  SELECT * INTO security_settings
  FROM public.super_admin_security
  WHERE user_id = _user_id;
  
  IF NOT FOUND THEN
    -- Create default security settings for super admin
    INSERT INTO public.super_admin_security (user_id)
    VALUES (_user_id)
    RETURNING * INTO security_settings;
  END IF;
  
  result := jsonb_build_object(
    'is_locked', security_settings.is_locked,
    'requires_ip_check', array_length(security_settings.allowed_ip_addresses, 1) > 0,
    'ip_allowed', CASE 
      WHEN array_length(security_settings.allowed_ip_addresses, 1) = 0 THEN true
      WHEN _ip_address IS NULL THEN false
      ELSE _ip_address::text = ANY(security_settings.allowed_ip_addresses)
    END,
    'requires_reauth', security_settings.require_periodic_reauth,
    'last_reauth_expired', CASE
      WHEN security_settings.last_security_check IS NULL THEN true
      WHEN security_settings.require_periodic_reauth THEN
        security_settings.last_security_check < (now() - (security_settings.reauth_interval_minutes || ' minutes')::interval)
      ELSE false
    END,
    'max_session_hours', security_settings.max_session_duration_hours
  );
  
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_super_admin_security_check(
  _user_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.super_admin_security
  SET 
    last_security_check = now(),
    failed_security_attempts = 0
  WHERE user_id = _user_id;
END;
$$;

-- Create trigger to update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_2fa_updated_at
    BEFORE UPDATE ON public.user_2fa
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_super_admin_security_updated_at
    BEFORE UPDATE ON public.super_admin_security
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();