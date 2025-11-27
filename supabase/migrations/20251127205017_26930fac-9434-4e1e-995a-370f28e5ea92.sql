-- Drop the email notification trigger and function that's causing the 400 error
-- The trigger was trying to call an edge function but the URL was null

DROP TRIGGER IF EXISTS on_direct_message_email_notification ON direct_messages;
DROP FUNCTION IF EXISTS notify_direct_message_via_email();