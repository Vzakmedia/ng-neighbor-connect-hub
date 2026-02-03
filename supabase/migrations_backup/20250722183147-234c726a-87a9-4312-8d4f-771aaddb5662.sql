-- Add is_confirmed field to emergency_contacts table
ALTER TABLE public.emergency_contacts 
ADD COLUMN is_confirmed BOOLEAN DEFAULT false;

-- Add confirm_code field to emergency_contacts table for verification
ALTER TABLE public.emergency_contacts
ADD COLUMN confirm_code TEXT;

-- Create a function to generate a random 6-digit confirmation code
CREATE OR REPLACE FUNCTION public.generate_confirmation_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN substring(md5(random()::text), 1, 6);
END;
$$;

-- Update trigger to automatically generate a confirm_code for new emergency contacts
CREATE OR REPLACE FUNCTION public.generate_emergency_contact_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.confirm_code := public.generate_confirmation_code();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to set the confirm_code on insert
CREATE TRIGGER set_emergency_contact_code
BEFORE INSERT ON public.emergency_contacts
FOR EACH ROW
EXECUTE FUNCTION public.generate_emergency_contact_code();