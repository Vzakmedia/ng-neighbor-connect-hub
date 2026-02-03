-- Create optimized function for checking recently active users
-- This combines multiple queries into one efficient lookup
CREATE OR REPLACE FUNCTION public.get_recently_active_users(since_timestamp timestamptz)
RETURNS TABLE (user_id uuid) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT dm.sender_id as user_id 
  FROM public.direct_messages dm
  WHERE dm.created_at >= since_timestamp
  UNION
  SELECT DISTINCT cp.user_id 
  FROM public.community_posts cp
  WHERE cp.created_at >= since_timestamp
  LIMIT 50;
END;
$$;