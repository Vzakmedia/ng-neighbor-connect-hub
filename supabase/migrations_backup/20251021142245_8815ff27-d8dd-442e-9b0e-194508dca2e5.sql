-- Fix search_path security issue for the validate_booking_references function
CREATE OR REPLACE FUNCTION validate_booking_references()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify client exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.client_id) THEN
    RAISE EXCEPTION 'Invalid client_id: Profile does not exist';
  END IF;
  
  -- Verify provider exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.provider_id) THEN
    RAISE EXCEPTION 'Invalid provider_id: Profile does not exist';
  END IF;
  
  -- Verify service exists
  IF NOT EXISTS (SELECT 1 FROM public.services WHERE id = NEW.service_id) THEN
    RAISE EXCEPTION 'Invalid service_id: Service does not exist';
  END IF;
  
  RETURN NEW;
END;
$$;