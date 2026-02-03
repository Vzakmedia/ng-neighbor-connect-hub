-- Add email column to emergency_contacts table for multi-search functionality
ALTER TABLE public.emergency_contacts 
ADD COLUMN IF NOT EXISTS email text;

-- Add profile_name column to emergency_contacts table for finding by name
ALTER TABLE public.emergency_contacts 
ADD COLUMN IF NOT EXISTS profile_name text;

-- Add search_query column for flexible searching
ALTER TABLE public.emergency_contacts 
ADD COLUMN IF NOT EXISTS search_query text;

-- Add search_type column to track how the contact was found
ALTER TABLE public.emergency_contacts 
ADD COLUMN IF NOT EXISTS search_type text DEFAULT 'phone';

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_search 
ON public.emergency_contacts(email, profile_name, search_query);

-- Update the check_contact_recipient function to handle multiple search methods
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