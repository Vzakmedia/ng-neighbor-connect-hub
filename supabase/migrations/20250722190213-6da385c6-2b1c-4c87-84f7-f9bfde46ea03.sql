-- Fix function search path security warnings
-- Update check_contact_recipient function to be secure
CREATE OR REPLACE FUNCTION public.check_contact_recipient()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Check if recipient_phone matches a user profile's phone
  UPDATE public.emergency_contact_requests
  SET recipient_id = profiles.user_id
  FROM public.profiles
  WHERE NEW.recipient_phone = profiles.phone
  AND emergency_contact_requests.id = NEW.id;

  RETURN NEW;
END;
$$;

-- Update generate_emergency_contact_code function to be secure
CREATE OR REPLACE FUNCTION public.generate_emergency_contact_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.confirm_code := public.generate_confirmation_code();
  RETURN NEW;
END;
$$;

-- Update generate_confirmation_code function to be secure
CREATE OR REPLACE FUNCTION public.generate_confirmation_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN substring(md5(random()::text), 1, 6);
END;
$$;