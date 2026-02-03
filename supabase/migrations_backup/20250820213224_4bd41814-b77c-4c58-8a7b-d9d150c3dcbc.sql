-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_safe_profile_for_interaction(uuid);

-- Create a function to mask phone numbers (replace last 4 digits with asterisks)
CREATE OR REPLACE FUNCTION public.mask_phone_number(phone_number text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF phone_number IS NULL OR LENGTH(phone_number) < 4 THEN
    RETURN phone_number;
  END IF;
  
  -- Replace last 4 digits with asterisks
  RETURN LEFT(phone_number, LENGTH(phone_number) - 4) || '****';
END;
$$;

-- Add phone_masked column to public_profiles if it doesn't exist
ALTER TABLE public.public_profiles 
ADD COLUMN IF NOT EXISTS phone_masked text;

-- Update existing records with masked phone numbers
UPDATE public.public_profiles 
SET phone_masked = (
  SELECT mask_phone_number(p.phone) 
  FROM public.profiles p 
  WHERE p.user_id = public.public_profiles.user_id
);

-- Update the sync_public_profile function to include masked phone
CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.public_profiles (
    user_id, 
    display_name, 
    avatar_url, 
    is_verified, 
    city, 
    state, 
    neighborhood, 
    bio, 
    phone_masked,
    updated_at
  )
  VALUES (
    NEW.user_id, 
    NEW.full_name, 
    NEW.avatar_url, 
    COALESCE(NEW.is_verified, false), 
    NEW.city, 
    NEW.state, 
    NEW.neighborhood, 
    NEW.bio, 
    mask_phone_number(NEW.phone),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        avatar_url = EXCLUDED.avatar_url,
        is_verified = EXCLUDED.is_verified,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        neighborhood = EXCLUDED.neighborhood,
        bio = EXCLUDED.bio,
        phone_masked = mask_phone_number(NEW.phone),
        updated_at = now();
  RETURN NEW;
END;
$function$;

-- Create new get_safe_profile_for_interaction function with masked phone
CREATE FUNCTION public.get_safe_profile_for_interaction(_user_id uuid)
RETURNS TABLE(
  user_id uuid, 
  full_name text, 
  avatar_url text, 
  bio text, 
  city text, 
  state text, 
  neighborhood text, 
  phone_masked text,
  is_verified boolean, 
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Return safe profile information with masked phone
  RETURN QUERY
  SELECT 
    pp.user_id,
    pp.display_name as full_name,
    pp.avatar_url,
    pp.bio,
    pp.city,
    pp.state,
    pp.neighborhood,
    pp.phone_masked,
    pp.is_verified,
    pp.created_at
  FROM public.public_profiles pp
  WHERE pp.user_id = _user_id;
END;
$$;

-- Create RLS policy to allow all authenticated users to view public profiles
DROP POLICY IF EXISTS "Allow public profile viewing" ON public.public_profiles;
CREATE POLICY "Allow authenticated users to view public profiles"
ON public.public_profiles
FOR SELECT
TO authenticated
USING (true);