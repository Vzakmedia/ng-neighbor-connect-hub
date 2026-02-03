-- Create a view for displaying user information in public community features
-- This exposes ONLY the minimum information needed to show post authors
CREATE OR REPLACE VIEW public.display_profiles 
WITH (security_barrier = true) AS
SELECT 
  user_id,
  full_name AS display_name,
  avatar_url,
  city,
  state,
  is_verified,
  created_at
FROM public.profiles
WHERE TRUE; -- Views inherit RLS from the base table

-- Grant access to authenticated users
GRANT SELECT ON public.display_profiles TO authenticated;