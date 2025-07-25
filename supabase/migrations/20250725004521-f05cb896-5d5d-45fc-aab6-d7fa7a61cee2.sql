-- Fix the remaining function search path warning
CREATE OR REPLACE FUNCTION public.generate_confirmation_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  RETURN substring(md5(random()::text), 1, 6);
END;
$$;