-- Create user automation preferences table
CREATE TABLE public.user_automation_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  automation_id UUID REFERENCES platform_automations NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  webhook_url TEXT,
  custom_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, automation_id)
);

-- Enable RLS
ALTER TABLE public.user_automation_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own automation preferences
CREATE POLICY "Users can manage their own automation preferences" 
ON public.user_automation_preferences 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Staff can view all automation preferences for support
CREATE POLICY "Staff can view automation preferences for support" 
ON public.user_automation_preferences 
FOR SELECT 
USING (has_staff_permission(auth.uid(), 'user_management', 'read'));

-- Create function to get user automation preferences with defaults
CREATE OR REPLACE FUNCTION public.get_user_automation_preferences(_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
  automation_id UUID,
  automation_name TEXT,
  automation_description TEXT,
  automation_type TEXT,
  automation_icon TEXT,
  is_enabled BOOLEAN,
  webhook_url TEXT,
  custom_settings JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    pa.id as automation_id,
    pa.name as automation_name,
    pa.description as automation_description,
    pa.automation_type,
    pa.icon as automation_icon,
    COALESCE(uap.is_enabled, false) as is_enabled,
    uap.webhook_url,
    COALESCE(uap.custom_settings, '{}'::jsonb) as custom_settings
  FROM public.platform_automations pa
  LEFT JOIN public.user_automation_preferences uap 
    ON pa.id = uap.automation_id AND uap.user_id = _user_id
  WHERE pa.is_active = true
  ORDER BY pa.created_at;
END;
$function$;

-- Create function to update user automation preference
CREATE OR REPLACE FUNCTION public.update_user_automation_preference(
  _automation_id UUID,
  _is_enabled BOOLEAN,
  _webhook_url TEXT DEFAULT NULL,
  _custom_settings JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_automation_preferences (
    user_id, 
    automation_id, 
    is_enabled, 
    webhook_url, 
    custom_settings,
    updated_at
  )
  VALUES (
    auth.uid(), 
    _automation_id, 
    _is_enabled, 
    _webhook_url, 
    _custom_settings,
    now()
  )
  ON CONFLICT (user_id, automation_id)
  DO UPDATE SET
    is_enabled = _is_enabled,
    webhook_url = _webhook_url,
    custom_settings = _custom_settings,
    updated_at = now();
END;
$function$;

-- Create trigger to log automation changes
CREATE OR REPLACE FUNCTION public.log_automation_preference_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.automation_logs (
    automation_id,
    execution_status,
    execution_details,
    executed_at
  )
  VALUES (
    COALESCE(NEW.automation_id, OLD.automation_id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'enabled'
      WHEN TG_OP = 'UPDATE' AND NEW.is_enabled != OLD.is_enabled THEN 
        CASE WHEN NEW.is_enabled THEN 'enabled' ELSE 'disabled' END
      WHEN TG_OP = 'DELETE' THEN 'disabled'
      ELSE 'updated'
    END,
    jsonb_build_object(
      'operation', TG_OP,
      'user_id', COALESCE(NEW.user_id, OLD.user_id),
      'webhook_url', COALESCE(NEW.webhook_url, OLD.webhook_url),
      'settings_changed', CASE WHEN TG_OP = 'UPDATE' THEN NEW.custom_settings != OLD.custom_settings ELSE false END
    ),
    now()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger for automation preference changes
CREATE TRIGGER automation_preference_change_log
  AFTER INSERT OR UPDATE OR DELETE ON public.user_automation_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.log_automation_preference_change();