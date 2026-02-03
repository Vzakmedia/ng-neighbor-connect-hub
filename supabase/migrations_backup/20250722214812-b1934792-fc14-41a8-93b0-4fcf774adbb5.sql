-- Fix remaining functions with mutable search paths

-- Fix calculate_distance function
CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN (
    6371 * acos(
      cos(radians(lat1)) * cos(radians(lat2)) * 
      cos(radians(lon2) - radians(lon1)) + 
      sin(radians(lat1)) * sin(radians(lat2))
    )
  );
END;
$$;

-- Fix handle_new_user_messaging_prefs function
CREATE OR REPLACE FUNCTION public.handle_new_user_messaging_prefs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.messaging_preferences (user_id, allow_messages, show_read_receipts, show_online_status)
    VALUES (NEW.id, true, true, true)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Ensure foreign key constraint on request_id for alert_notifications
ALTER TABLE public.alert_notifications 
DROP CONSTRAINT IF EXISTS alert_notifications_request_id_fkey,
ADD CONSTRAINT alert_notifications_request_id_fkey 
FOREIGN KEY (request_id) REFERENCES public.emergency_contact_requests(id) ON DELETE CASCADE;

-- Create table for storing contact invitation codes
CREATE TABLE IF NOT EXISTS public.contact_invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_request_id UUID NOT NULL REFERENCES public.emergency_contact_requests(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  used BOOLEAN DEFAULT false
);

-- Enable RLS on invitation codes
ALTER TABLE public.contact_invitation_codes ENABLE ROW LEVEL SECURITY;

-- Policy for viewing invitation codes
CREATE POLICY "Users can view their own invitation codes" 
ON public.contact_invitation_codes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.emergency_contact_requests
  WHERE emergency_contact_requests.id = contact_invitation_codes.contact_request_id
  AND (
    emergency_contact_requests.sender_id = auth.uid() OR
    emergency_contact_requests.recipient_id = auth.uid()
  )
));