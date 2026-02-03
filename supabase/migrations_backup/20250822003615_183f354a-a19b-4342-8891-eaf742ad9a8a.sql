-- Fix the get_feed function to properly filter by author location, not post target location
CREATE OR REPLACE FUNCTION public.get_feed(
  target_user_id uuid,
  filter_level text DEFAULT 'neighbourhood',
  limit_count int DEFAULT 20,
  cursor timestamptz DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  content text,
  title text,
  image_urls text[],
  tags text[],
  location text,
  location_scope location_scope,
  target_neighborhood text,
  target_city text,
  target_state text,
  rsvp_enabled boolean,
  created_at timestamptz,
  updated_at timestamptz,
  author_name text,
  author_avatar text,
  likes_count bigint,
  comments_count bigint,
  feed_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Get user's profile information
  SELECT p.neighbourhood, p.city, p.state, p.location
  INTO user_profile
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
  
  IF user_profile IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  RETURN QUERY
  SELECT 
    cp.id,
    cp.user_id,
    cp.content,
    cp.title,
    cp.image_urls,
    cp.tags,
    cp.location,
    cp.location_scope,
    cp.target_neighborhood,
    cp.target_city,
    cp.target_state,
    cp.rsvp_enabled,
    cp.created_at,
    cp.updated_at,
    p.full_name as author_name,
    p.avatar_url as author_avatar,
    COALESCE(likes.count, 0) as likes_count,
    COALESCE(comments.count, 0) as comments_count,
    -- Calculate feed score: engagement + recency
    (
      COALESCE(likes.count, 0) * 0.5 + 
      COALESCE(comments.count, 0) * 0.3 +
      (1.0 / EXTRACT(EPOCH FROM (now() - cp.created_at))) * 100
    ) as feed_score
  FROM public.community_posts cp
  JOIN public.profiles p ON cp.user_id = p.user_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as count
    FROM public.post_likes
    GROUP BY post_id
  ) likes ON cp.id = likes.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as count  
    FROM public.post_comments
    GROUP BY post_id
  ) comments ON cp.id = comments.post_id
  WHERE 
    -- Apply cursor pagination
    (cursor IS NULL OR cp.created_at < cursor)
    AND
    -- Apply location filtering based on post author's location, not post target
    CASE 
      WHEN filter_level = 'neighborhood' OR filter_level = 'neighbourhood' THEN
        p.neighbourhood = user_profile.neighbourhood 
        AND p.city = user_profile.city 
        AND p.state = user_profile.state
      WHEN filter_level = 'city' THEN
        p.city = user_profile.city 
        AND p.state = user_profile.state
      WHEN filter_level = 'state' THEN
        p.state = user_profile.state
      ELSE true -- 'all' or invalid filter_level
    END
  ORDER BY feed_score DESC, cp.created_at DESC
  LIMIT limit_count;
END;
$$;