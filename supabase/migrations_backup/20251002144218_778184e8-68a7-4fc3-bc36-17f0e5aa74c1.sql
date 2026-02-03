-- Fix get_user_automation_preferences function to remove non-existent icon column
CREATE OR REPLACE FUNCTION public.get_user_automation_preferences()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  trigger_type text,
  trigger_conditions jsonb,
  action_type text,
  action_config jsonb,
  is_enabled boolean,
  is_preset boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  -- Get user's custom automations
  SELECT 
    ua.id,
    ua.name,
    ua.description,
    ua.trigger_type,
    ua.trigger_conditions,
    ua.action_type,
    ua.action_config,
    ua.is_enabled,
    false as is_preset
  FROM public.user_automations ua
  WHERE ua.user_id = auth.uid()
  
  UNION ALL
  
  -- Get preset automations (without user-specific enabled status)
  SELECT 
    pa.id,
    pa.name,
    pa.description,
    pa.trigger_type,
    pa.default_trigger_conditions as trigger_conditions,
    pa.action_type,
    pa.default_action_config as action_config,
    false as is_enabled,
    true as is_preset
  FROM public.preset_automations pa
  WHERE pa.is_active = true;
END;
$$;