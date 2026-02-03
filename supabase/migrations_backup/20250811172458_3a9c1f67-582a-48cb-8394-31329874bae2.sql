-- Secure emergency_contacts with strict RLS and add a safe RPC for lookups

-- 1) Enable Row Level Security
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- 2) Remove any potentially permissive existing policies (safe if they don't exist)
DROP POLICY IF EXISTS "Public read of emergency contacts" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Allow anonymous read" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Users can read emergency contacts" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Users can manage emergency contacts" ON public.emergency_contacts;

-- 3) Owner-only policies (principle of least privilege)
CREATE POLICY "Users can view their own emergency contacts"
  ON public.emergency_contacts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emergency contacts"
  ON public.emergency_contacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emergency contacts"
  ON public.emergency_contacts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emergency contacts"
  ON public.emergency_contacts
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4) Safe RPC to get user_ids that listed the current user's phone, without exposing contact details
CREATE OR REPLACE FUNCTION public.get_users_who_listed_my_phone()
RETURNS TABLE (user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  digits_input text;
BEGIN
  -- Normalize current user's phone to last 10 digits
  SELECT right(regexp_replace(COALESCE(p.phone, ''), '\\D', '', 'g'), 10)
    INTO digits_input
  FROM public.profiles p
  WHERE p.user_id = auth.uid();

  IF digits_input IS NULL OR digits_input = '' THEN
    RETURN;
  END IF;

  -- Return only user_id of owners who listed this phone
  RETURN QUERY
  SELECT ec.user_id
  FROM public.emergency_contacts ec
  WHERE right(regexp_replace(COALESCE(ec.phone_number, ''), '\\D', '', 'g'), 10) = digits_input;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_users_who_listed_my_phone() TO authenticated;