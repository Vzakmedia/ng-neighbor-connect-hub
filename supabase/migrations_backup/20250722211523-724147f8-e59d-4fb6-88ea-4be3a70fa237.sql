-- Fix the email column issue in check_contact_recipient function
-- Add email column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text;

-- Update the check_contact_recipient function to handle the correct columns
CREATE OR REPLACE FUNCTION public.check_contact_recipient()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Check if recipient matches by phone, email, or profile name
  UPDATE public.emergency_contact_requests
  SET recipient_id = profiles.user_id
  FROM public.profiles
  WHERE (
    (NEW.recipient_phone = profiles.phone) OR
    (NEW.recipient_phone = profiles.email) OR  
    (NEW.recipient_phone = profiles.full_name)
  )
  AND emergency_contact_requests.id = NEW.id;

  RETURN NEW;
END;
$$;