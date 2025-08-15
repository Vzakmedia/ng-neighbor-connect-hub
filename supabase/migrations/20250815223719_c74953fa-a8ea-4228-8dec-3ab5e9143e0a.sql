-- Fix search path for the function
DROP FUNCTION IF EXISTS public.update_user_consents_updated_at();

CREATE OR REPLACE FUNCTION public.update_user_consents_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;