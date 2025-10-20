-- Fix get_user_automation_preferences function to work with actual database schema
DROP FUNCTION IF EXISTS public.get_user_automation_preferences();

CREATE OR REPLACE FUNCTION public.get_user_automation_preferences()
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
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.id as automation_id,
    pa.name as automation_name,
    pa.description as automation_description,
    pa.automation_type,
    -- Map automation_type to icon since icon column doesn't exist
    CASE pa.automation_type
      WHEN 'content_moderation' THEN 'Shield'
      WHEN 'user_management' THEN 'Users'
      WHEN 'emergency_response' THEN 'AlertTriangle'
      WHEN 'marketplace' THEN 'ShoppingCart'
      WHEN 'notifications' THEN 'Bell'
      WHEN 'analytics' THEN 'BarChart'
      ELSE 'Settings'
    END as automation_icon,
    COALESCE(uap.is_enabled, false) as is_enabled,
    uap.webhook_url,
    COALESCE(uap.custom_settings, '{}'::jsonb) as custom_settings
  FROM public.platform_automations pa
  LEFT JOIN public.user_automation_preferences uap 
    ON pa.id = uap.automation_id 
    AND uap.user_id = auth.uid()
  WHERE pa.is_active = true
  ORDER BY pa.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_user_automation_preferences() IS 
'Returns platform automations with user preferences. Maps automation_type to icons since icon column does not exist in platform_automations table.';