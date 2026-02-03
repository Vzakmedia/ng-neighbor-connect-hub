-- Create emergency_contact_requests table for invitation system
CREATE TABLE public.emergency_contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_phone TEXT NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notification_sent BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.emergency_contact_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for emergency_contact_requests
CREATE POLICY "Users can create contact requests" 
ON public.emergency_contact_requests 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view their sent contact requests" 
ON public.emergency_contact_requests 
FOR SELECT 
USING (auth.uid() = sender_id);

CREATE POLICY "Users can view contact requests for their phone number" 
ON public.emergency_contact_requests 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.phone = recipient_phone
));

CREATE POLICY "Users can update their own contact requests" 
ON public.emergency_contact_requests 
FOR UPDATE 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Add realtime capability to emergency tables
ALTER TABLE public.emergency_contacts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_contacts;

ALTER TABLE public.emergency_contact_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_contact_requests;

ALTER TABLE public.panic_alerts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.panic_alerts;

-- Add function to create or update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps on emergency_contact_requests
CREATE TRIGGER update_emergency_contact_requests_updated_at
BEFORE UPDATE ON public.emergency_contact_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();