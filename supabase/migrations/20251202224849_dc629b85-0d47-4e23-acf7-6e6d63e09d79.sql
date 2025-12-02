-- Step 1: Fix trigger ordering - change from BEFORE to AFTER INSERT
DROP TRIGGER IF EXISTS trigger_contact_invitation_webhook_trigger ON emergency_contact_requests;

-- Step 2: Update the trigger function to work with AFTER INSERT
-- Since we can't modify the row in AFTER INSERT, we need to handle notification_sent differently
CREATE OR REPLACE FUNCTION trigger_contact_invitation_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if recipient_id is set (meaning user exists in system)
  IF NEW.recipient_id IS NOT NULL AND NEW.notification_sent = false THEN
    -- Create the notification directly in the database instead of calling edge function
    INSERT INTO alert_notifications (
      recipient_id,
      notification_type,
      sender_name,
      sender_phone,
      content,
      request_id
    )
    SELECT 
      NEW.recipient_id,
      'contact_request',
      p.full_name,
      p.phone,
      p.full_name || ' wants to add you as an emergency contact',
      NEW.id
    FROM profiles p
    WHERE p.user_id = NEW.sender_id;
    
    -- Update the request to mark notification as sent
    UPDATE emergency_contact_requests 
    SET notification_sent = true 
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger as AFTER INSERT
CREATE TRIGGER trigger_contact_invitation_webhook_trigger
  AFTER INSERT ON emergency_contact_requests
  FOR EACH ROW EXECUTE FUNCTION trigger_contact_invitation_webhook();

-- Step 3: Backfill missing notifications for existing pending requests
INSERT INTO alert_notifications (recipient_id, notification_type, sender_name, sender_phone, content, request_id)
SELECT 
  ecr.recipient_id,
  'contact_request',
  p.full_name,
  p.phone,
  p.full_name || ' wants to add you as an emergency contact',
  ecr.id
FROM emergency_contact_requests ecr
JOIN profiles p ON p.user_id = ecr.sender_id
LEFT JOIN alert_notifications an ON an.request_id = ecr.id
WHERE ecr.recipient_id IS NOT NULL 
  AND ecr.status = 'pending'
  AND an.id IS NULL;

-- Update notification_sent for backfilled requests
UPDATE emergency_contact_requests 
SET notification_sent = true 
WHERE recipient_id IS NOT NULL 
  AND status = 'pending'
  AND notification_sent = false;