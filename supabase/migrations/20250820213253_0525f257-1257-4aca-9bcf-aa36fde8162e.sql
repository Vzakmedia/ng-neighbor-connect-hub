-- Fix search path security issue
CREATE OR REPLACE FUNCTION public.get_safe_profile_for_interaction(_user_id uuid)
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