-- Create a view for safe staff analytics that doesn't expose personal data
CREATE OR REPLACE VIEW public.profiles_analytics AS
SELECT 
  user_id,
  created_at,
  updated_at,
  city,
  state,
  is_verified,
  (full_name IS NOT NULL AND full_name != '') as has_name,
  (email IS NOT NULL AND email != '') as has_email,
  (phone IS NOT NULL AND phone != '') as has_phone,
  (address IS NOT NULL AND address != '') as has_address
FROM public.profiles;

-- Create a function to allow safe analytics access
CREATE OR REPLACE FUNCTION public.get_profiles_analytics()
RETURNS SETOF public.profiles_analytics
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
  SELECT * FROM public.profiles_analytics;
END;
$$;