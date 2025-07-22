-- Enable realtime for public_emergency_alerts table
ALTER TABLE public.public_emergency_alerts REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
BEGIN;
  -- Remove the table from the publication if it exists
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- Create the publication with the table
  CREATE PUBLICATION supabase_realtime;
  
  -- Add existing tables that should have realtime
  ALTER PUBLICATION supabase_realtime ADD TABLE alert_notifications;
  ALTER PUBLICATION supabase_realtime ADD TABLE emergency_contact_requests;
  ALTER PUBLICATION supabase_realtime ADD TABLE public_emergency_alerts;
  ALTER PUBLICATION supabase_realtime ADD TABLE panic_alerts;
  ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE direct_conversations;
COMMIT;