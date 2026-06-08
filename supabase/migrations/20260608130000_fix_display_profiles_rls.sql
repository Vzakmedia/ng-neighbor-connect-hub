-- Fix comment authors showing as "Anonymous User" / "Unknown User".
--
-- The display_profiles view was reading from public.profiles, which has
-- restrictive SELECT RLS policies (owner, staff, DM partners, active
-- service-booking partners). So when User B viewed a comment by User A
-- they couldn't see A's name unless they had a prior interaction — every
-- other comment fell back to "Anonymous User".
--
-- This safely exposes ONLY the public-facing columns (display name, avatar,
-- city, state, verified flag) to every authenticated user, while sensitive
-- columns (email, phone, address) remain locked down by the existing RLS
-- on the base table.

-- 1) SECURITY DEFINER source function — bypasses RLS but ONLY returns
--    the safe public columns. No way to leak email/phone/address through it.
CREATE OR REPLACE FUNCTION public.get_safe_display_profiles()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  city text,
  state text,
  is_verified boolean,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    p.user_id,
    p.full_name AS display_name,
    p.avatar_url,
    p.city,
    p.state,
    p.is_verified,
    p.created_at
  FROM public.profiles p;
$$;

-- Only authenticated users can read public display data.
REVOKE ALL ON FUNCTION public.get_safe_display_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_safe_display_profiles() TO authenticated;

-- 2) Recreate the view so client code that does
--      supabase.from('display_profiles').select(...).in('user_id', [...])
--    keeps working — but the data now comes from the SECURITY DEFINER
--    function instead of being filtered by profiles RLS.
DROP VIEW IF EXISTS public.display_profiles;

CREATE VIEW public.display_profiles AS
SELECT * FROM public.get_safe_display_profiles();

GRANT SELECT ON public.display_profiles TO authenticated;
