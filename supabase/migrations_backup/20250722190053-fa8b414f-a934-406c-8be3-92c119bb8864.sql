-- Ensure the emergency_contact_requests table has required fields
ALTER TABLE public.emergency_contact_requests 
ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index on recipient_id for better query performance
CREATE INDEX IF NOT EXISTS idx_emergency_contact_requests_recipient_id
ON public.emergency_contact_requests(recipient_id);

-- Create function to check for app user and update notification_sent
CREATE OR REPLACE FUNCTION public.check_contact_recipient()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if recipient_phone matches a user profile's phone
  UPDATE public.emergency_contact_requests
  SET recipient_id = profiles.user_id
  FROM public.profiles
  WHERE NEW.recipient_phone = profiles.phone
  AND emergency_contact_requests.id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run after insert on emergency_contact_requests
DROP TRIGGER IF EXISTS check_contact_recipient_trigger ON public.emergency_contact_requests;
CREATE TRIGGER check_contact_recipient_trigger
AFTER INSERT ON public.emergency_contact_requests
FOR EACH ROW
EXECUTE FUNCTION public.check_contact_recipient();

-- Enable realtime for emergency_contact_requests if not already enabled
SELECT coalesce(
  (SELECT true FROM pg_publication_tables 
   WHERE pubname = 'supabase_realtime' 
   AND schemaname = 'public' 
   AND tablename = 'emergency_contact_requests'),
  false
) as is_published;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'emergency_contact_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_contact_requests;
    ALTER TABLE public.emergency_contact_requests REPLICA IDENTITY FULL;
  END IF;
END$$;