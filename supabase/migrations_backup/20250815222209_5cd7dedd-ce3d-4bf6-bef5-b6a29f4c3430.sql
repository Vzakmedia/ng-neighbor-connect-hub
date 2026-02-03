-- Drop the function first, then the view to resolve dependencies
DROP FUNCTION IF EXISTS public.get_profiles_analytics();
DROP VIEW IF EXISTS public.profiles_analytics;

-- Create the analytics function to return the analytics data structure directly without a view
CREATE OR REPLACE FUNCTION public.get_profiles_analytics()
RETURNS TABLE (
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  city text,
  state text,
  is_verified boolean,
  has_name boolean,
  has_email boolean,
  has_phone boolean,
  has_address boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow staff with analytics permissions
  IF NOT has_staff_permission(auth.uid(), 'analytics', 'read') THEN
    RAISE EXCEPTION 'Insufficient permissions to access analytics data';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.user_id,
    p.created_at,
    p.updated_at,
    p.city,
    p.state,
    p.is_verified,
    (p.full_name IS NOT NULL AND p.full_name != '') as has_name,
    (p.email IS NOT NULL AND p.email != '') as has_email,
    (p.phone IS NOT NULL AND p.phone != '') as has_phone,
    (p.address IS NOT NULL AND p.address != '') as has_address
  FROM public.profiles p;
END;
$$;