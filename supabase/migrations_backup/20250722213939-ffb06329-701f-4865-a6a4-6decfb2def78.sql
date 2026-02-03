-- Add columns to alert_notifications table to support contact request notifications
ALTER TABLE public.alert_notifications 
ADD COLUMN IF NOT EXISTS sender_name text,
ADD COLUMN IF NOT EXISTS sender_phone text,
ADD COLUMN IF NOT EXISTS content text,
ADD COLUMN IF NOT EXISTS request_id uuid REFERENCES public.emergency_contact_requests(id) ON DELETE CASCADE;

-- Create database function webhook to trigger the edge function when a contact request is created
CREATE OR REPLACE FUNCTION public.handle_new_contact_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Call the edge function via a scheduled task (would happen asynchronously)
  -- This is a placeholder that will be handled by the edge function directly
  RETURN NEW;
END;
$$;

-- Create trigger for the function
DROP TRIGGER IF EXISTS on_contact_request_created ON public.emergency_contact_requests;
CREATE TRIGGER on_contact_request_created
  AFTER INSERT ON public.emergency_contact_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_contact_request();

-- Update EmergencyNotification table subscription settings
ALTER TABLE public.alert_notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_notifications;