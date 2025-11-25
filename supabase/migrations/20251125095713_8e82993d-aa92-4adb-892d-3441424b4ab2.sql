-- Add default security and rate limiting configurations to app_configuration table

-- Security Settings
INSERT INTO app_configuration (config_key, config_type, config_value, description, updated_by, is_public)
VALUES 
  ('security.password_min_length', 'app_settings', '8'::jsonb, 'Minimum password length requirement', (SELECT id FROM auth.users LIMIT 1), false),
  ('security.session_timeout_minutes', 'app_settings', '60'::jsonb, 'Session timeout in minutes', (SELECT id FROM auth.users LIMIT 1), false),
  ('security.max_login_attempts', 'app_settings', '5'::jsonb, 'Maximum failed login attempts before lockout', (SELECT id FROM auth.users LIMIT 1), false),
  ('security.lockout_duration_minutes', 'app_settings', '30'::jsonb, 'Account lockout duration in minutes', (SELECT id FROM auth.users LIMIT 1), false),
  ('security.require_email_verification', 'app_settings', 'true'::jsonb, 'Require email verification for new accounts', (SELECT id FROM auth.users LIMIT 1), false),
  ('security.allowed_signup_domains', 'app_settings', '[]'::jsonb, 'List of allowed email domains for signup (empty = all allowed)', (SELECT id FROM auth.users LIMIT 1), false)
ON CONFLICT (config_key) DO NOTHING;

-- Rate Limiting Configuration
INSERT INTO app_configuration (config_key, config_type, config_value, description, updated_by, is_public)
VALUES 
  ('rate_limit.panic_button_cooldown_seconds', 'app_settings', '60'::jsonb, 'Cooldown period between panic button activations', (SELECT id FROM auth.users LIMIT 1), false),
  ('rate_limit.max_panics_per_hour', 'app_settings', '3'::jsonb, 'Maximum panic button activations per hour', (SELECT id FROM auth.users LIMIT 1), false),
  ('rate_limit.api_rate_limit_per_minute', 'app_settings', '60'::jsonb, 'API requests allowed per minute per user', (SELECT id FROM auth.users LIMIT 1), false),
  ('rate_limit.post_rate_limit_per_hour', 'app_settings', '10'::jsonb, 'Maximum posts per hour per user', (SELECT id FROM auth.users LIMIT 1), false),
  ('rate_limit.message_rate_limit_per_minute', 'app_settings', '20'::jsonb, 'Maximum messages per minute per user', (SELECT id FROM auth.users LIMIT 1), false),
  ('rate_limit.comment_rate_limit_per_hour', 'app_settings', '30'::jsonb, 'Maximum comments per hour per user', (SELECT id FROM auth.users LIMIT 1), false)
ON CONFLICT (config_key) DO NOTHING;

-- Create RPC function to get configuration by prefix
CREATE OR REPLACE FUNCTION get_config_by_prefix(prefix_param text)
RETURNS TABLE (
  config_key text,
  config_value jsonb,
  description text,
  updated_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.config_key,
    ac.config_value,
    ac.description,
    ac.updated_at
  FROM app_configuration ac
  WHERE ac.config_key LIKE prefix_param || '%'
  ORDER BY ac.config_key;
END;
$$;

-- Create RPC function to batch update configurations
CREATE OR REPLACE FUNCTION batch_update_configs(configs jsonb)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  config_item jsonb;
  updated_count integer := 0;
  error_count integer := 0;
BEGIN
  -- Iterate through each config in the array
  FOR config_item IN SELECT * FROM jsonb_array_elements(configs)
  LOOP
    BEGIN
      INSERT INTO app_configuration (
        config_key,
        config_type,
        config_value,
        description,
        updated_by,
        is_public
      )
      VALUES (
        config_item->>'config_key',
        COALESCE(config_item->>'config_type', 'app_settings'),
        (config_item->>'config_value')::jsonb,
        config_item->>'description',
        auth.uid(),
        COALESCE((config_item->>'is_public')::boolean, false)
      )
      ON CONFLICT (config_key) 
      DO UPDATE SET
        config_value = EXCLUDED.config_value,
        description = EXCLUDED.description,
        updated_at = now(),
        updated_by = auth.uid();
      
      updated_count := updated_count + 1;
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'updated_count', updated_count,
    'error_count', error_count
  );
END;
$$;