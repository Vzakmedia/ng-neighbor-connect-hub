-- Create a function to notify contacts via email when an emergency alert is created
CREATE OR REPLACE FUNCTION notify_emergency_via_email()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient_email TEXT;
  v_sender_name TEXT;
  v_panic_data RECORD;
  v_preferences RECORD;
  v_supabase_url TEXT;
  v_service_key TEXT;
  v_template_data JSONB;
  v_app_url TEXT := 'https://neighborlink.ng'; -- Default fallback
BEGIN
  -- Only proceed for emergency/panic alerts
  IF NEW.notification_type NOT IN ('emergency_alert', 'panic_alert') THEN
    RETURN NEW;
  END IF;

  -- Get Supabase URL and Service Key from app_configuration
  SELECT config_value #>> '{}' INTO v_supabase_url FROM app_configuration WHERE config_key = 'supabase_url';
  SELECT config_value #>> '{}' INTO v_service_key FROM app_configuration WHERE config_key = 'service_role_key';
  
  -- Try to get custom app URL if configured
  BEGIN
    SELECT config_value #>> '{}' INTO v_app_url FROM app_configuration WHERE config_key = 'app_url';
    IF v_app_url IS NULL THEN v_app_url := 'https://neighborlink.ng'; END IF;
  EXCEPTION WHEN OTHERS THEN
    v_app_url := 'https://neighborlink.ng';
  END;

  -- If config is missing, fail gracefully
  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    -- Log error if possible, or just exit
    RETURN NEW;
  END IF;

  -- Get recipient email
  SELECT email INTO v_recipient_email FROM auth.users WHERE id = NEW.recipient_id;
  IF v_recipient_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check user preferences for emergency emails
  SELECT * INTO v_preferences FROM user_email_preferences WHERE user_id = NEW.recipient_id;
  
  -- If preferences exist and emergency_alerts is disabled, exit.
  -- Default behavior: ENABLED (if no preferences record exists yet)
  IF v_preferences IS NOT NULL AND v_preferences.emergency_alerts = false THEN
    RETURN NEW;
  END IF;

  -- Get comprehensive panic alert details
  -- We join with profiles to get the sender's name immediately if possible
  SELECT pa.*, p.full_name as sender_name 
  INTO v_panic_data 
  FROM panic_alerts pa
  LEFT JOIN profiles p ON p.user_id = pa.user_id
  WHERE pa.id = NEW.panic_alert_id;
  
  -- Fallback for sender name
  v_sender_name := COALESCE(v_panic_data.sender_name, 'Someone');

  -- Prepare email payload matching the template structure
  v_template_data := jsonb_build_object(
    'alertType', v_panic_data.situation_type,
    'location', v_panic_data.address,
    'description', v_panic_data.message,
    'timestamp', v_panic_data.created_at,
    'senderName', v_sender_name,
    'appUrl', v_app_url,
    'authorName', v_sender_name -- for consistent template usage
  );

  -- Call the Edge Function
  PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/send-email-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key,
      'x-supabase-url', v_supabase_url,
      'x-supabase-key', v_service_key
    ),
    body := jsonb_build_object(
      'to', v_recipient_email,
      'subject', '🚨 EMERGENCY ALERT: ' || v_sender_name || ' needs help!',
      'type', 'emergency_alert',
      'data', v_template_data,
      'body', 'Emergency alert triggered by ' || v_sender_name -- Generic text body fallback
    )::text
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error to a table if it exists, or ignore to prevent transaction failure
  -- Insert into error_logs (message) VALUES (SQLERRM);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow clean re-application
DROP TRIGGER IF EXISTS notify_emergency_via_email_trigger ON alert_notifications;

-- Create the trigger
CREATE TRIGGER notify_emergency_via_email_trigger
AFTER INSERT ON alert_notifications
FOR EACH ROW
EXECUTE FUNCTION notify_emergency_via_email();
