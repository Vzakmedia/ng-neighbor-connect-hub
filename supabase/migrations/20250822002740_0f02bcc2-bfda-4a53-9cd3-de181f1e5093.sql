-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Update profiles table with location columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS location geography(Point, 4326),
ADD COLUMN IF NOT EXISTS neighbourhood text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles (city);
CREATE INDEX IF NOT EXISTS idx_profiles_state ON public.profiles (state);
CREATE INDEX IF NOT EXISTS idx_profiles_neighbourhood ON public.profiles (neighbourhood);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts (created_at);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts (user_id);

-- Create location-based feed function
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
    -- Apply location filtering
    CASE 
      WHEN filter_level = 'neighbourhood' THEN
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

-- Enable realtime for community_posts table (only if not already enabled)
ALTER TABLE public.community_posts REPLICA IDENTITY FULL;

-- Create helper function to check if post matches user's location filter
CREATE OR REPLACE FUNCTION public.post_matches_user_filter(
  post_user_id uuid,
  target_user_id uuid,
  filter_level text DEFAULT 'neighbourhood'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  post_user_profile RECORD;
  target_user_profile RECORD;
BEGIN
  -- Get both user profiles
  SELECT neighbourhood, city, state
  INTO post_user_profile
  FROM public.profiles
  WHERE user_id = post_user_id;
  
  SELECT neighbourhood, city, state
  INTO target_user_profile
  FROM public.profiles
  WHERE user_id = target_user_id;
  
  -- Check if both profiles exist
  IF post_user_profile IS NULL OR target_user_profile IS NULL THEN
    RETURN false;
  END IF;
  
  -- Apply location matching logic
  RETURN CASE 
    WHEN filter_level = 'neighbourhood' THEN
      post_user_profile.neighbourhood = target_user_profile.neighbourhood 
      AND post_user_profile.city = target_user_profile.city 
      AND post_user_profile.state = target_user_profile.state
    WHEN filter_level = 'city' THEN
      post_user_profile.city = target_user_profile.city 
      AND post_user_profile.state = target_user_profile.state
    WHEN filter_level = 'state' THEN
      post_user_profile.state = target_user_profile.state
    ELSE true -- 'all' or invalid filter_level
  END;
END;
$$;