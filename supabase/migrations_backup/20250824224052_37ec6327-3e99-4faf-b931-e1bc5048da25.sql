-- First, let's make sure all profiles are synced to public_profiles
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
  created_at,
  updated_at
)
SELECT 
  p.user_id,
  p.full_name as display_name,
  p.avatar_url,
  COALESCE(p.is_verified, false) as is_verified,
  p.city,
  p.state,
  p.neighborhood,
  p.bio,
  mask_phone_number(p.phone) as phone_masked,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.public_profiles pp 
  WHERE pp.user_id = p.user_id
);

-- Update existing public_profiles with any missing data
UPDATE public.public_profiles 
SET 
  display_name = COALESCE(public.public_profiles.display_name, p.full_name),
  avatar_url = COALESCE(public.public_profiles.avatar_url, p.avatar_url),
  is_verified = COALESCE(public.public_profiles.is_verified, p.is_verified, false),
  city = COALESCE(public.public_profiles.city, p.city),
  state = COALESCE(public.public_profiles.state, p.state),
  neighborhood = COALESCE(public.public_profiles.neighborhood, p.neighborhood),
  bio = COALESCE(public.public_profiles.bio, p.bio),
  phone_masked = COALESCE(public.public_profiles.phone_masked, mask_phone_number(p.phone)),
  updated_at = GREATEST(public.public_profiles.updated_at, p.updated_at)
FROM public.profiles p
WHERE public.public_profiles.user_id = p.user_id
  AND (
    public.public_profiles.display_name IS NULL OR
    public.public_profiles.avatar_url IS NULL OR
    public.public_profiles.city IS NULL OR
    public.public_profiles.state IS NULL OR
    public.public_profiles.neighborhood IS NULL OR
    public.public_profiles.bio IS NULL OR
    public.public_profiles.phone_masked IS NULL OR
    public.public_profiles.updated_at < p.updated_at
  );

-- Ensure the sync trigger is working properly by recreating it
CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    created_at,
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
    NEW.created_at,
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
$$;

-- Make sure the trigger exists and is active
DROP TRIGGER IF EXISTS sync_public_profile_trigger ON public.profiles;
CREATE TRIGGER sync_public_profile_trigger
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_public_profile();