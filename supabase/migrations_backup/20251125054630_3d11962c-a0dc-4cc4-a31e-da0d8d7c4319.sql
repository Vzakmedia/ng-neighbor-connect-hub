-- Create RPC function to get users with unverified emails
CREATE OR REPLACE FUNCTION get_unverified_email_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  created_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email,
    p.full_name,
    au.created_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.user_id
  WHERE au.email_confirmed_at IS NULL
    AND au.email IS NOT NULL
  ORDER BY au.created_at DESC
  LIMIT 50;
END;
$$;