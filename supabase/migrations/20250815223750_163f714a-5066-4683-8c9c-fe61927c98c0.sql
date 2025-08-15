-- Drop the trigger first, then recreate the function with proper search path
DROP TRIGGER IF EXISTS update_user_consents_updated_at ON public.user_consents;
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

-- Recreate the trigger
CREATE TRIGGER update_user_consents_updated_at
BEFORE UPDATE ON public.user_consents
FOR EACH ROW
EXECUTE FUNCTION public.update_user_consents_updated_at();