-- Create function to send email for direct messages
CREATE OR REPLACE FUNCTION notify_direct_message_via_email()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_sender_name TEXT;
  v_recipient_email TEXT;
  v_email_enabled BOOLEAN;
  v_messages_enabled BOOLEAN;
BEGIN
  -- Get sender's name
  SELECT full_name INTO v_sender_name
  FROM profiles
  WHERE user_id = NEW.sender_id;
  
  -- Get recipient's email preferences
  SELECT 
    uep.email_enabled,
    uep.messages,
    au.email
  INTO 
    v_email_enabled,
    v_messages_enabled,
    v_recipient_email
  FROM user_email_preferences uep
  JOIN auth.users au ON au.id = uep.user_id
  WHERE uep.user_id = NEW.recipient_id;
  
  -- Check if recipient has email notifications enabled for messages
  IF v_email_enabled = TRUE 
     AND v_messages_enabled = TRUE 
     AND v_recipient_email IS NOT NULL THEN
    
    -- Call edge function to send email
    PERFORM
      net.http_post(
        url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-email-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'to', v_recipient_email,
          'subject', 'New message from ' || v_sender_name,
          'type', 'direct_message',
          'userId', NEW.recipient_id,
          'data', jsonb_build_object(
            'senderName', v_sender_name,
            'messageContent', LEFT(NEW.content, 200)
          )
        )
      );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_direct_message_email_notification ON direct_messages;
CREATE TRIGGER on_direct_message_email_notification
  AFTER INSERT ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_direct_message_via_email();