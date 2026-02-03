-- Fix the get_location_filtered_posts function to properly handle 'all' scoped posts
CREATE OR REPLACE FUNCTION public.get_location_filtered_posts(
  user_neighborhood text DEFAULT NULL,
  user_city text DEFAULT NULL,
  user_state text DEFAULT NULL,
  show_all_posts boolean DEFAULT false,
  post_limit integer DEFAULT 20,
  post_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  content text,
  title text,
  image_urls text[],
  file_urls jsonb,
  tags text[],
  location text,
  location_scope location_scope,
  target_neighborhood text,
  target_city text,
  target_state text,
  rsvp_enabled boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  author_name text,
  author_avatar text,
  author_neighborhood text,
  author_city text,
  author_state text,
  likes_count bigint,
  comments_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.user_id,
    cp.content,
    cp.title,
    cp.image_urls,
    cp.file_urls,
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
    p.neighborhood as author_neighborhood,
    p.city as author_city,
    p.state as author_state,
    COALESCE(l.likes_count, 0) as likes_count,
    COALESCE(c.comments_count, 0) as comments_count
  FROM public.community_posts cp
  JOIN public.profiles p ON cp.user_id = p.user_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as likes_count
    FROM public.post_likes
    GROUP BY post_id
  ) l ON cp.id = l.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as comments_count
    FROM public.post_comments
    GROUP BY post_id
  ) c ON cp.id = c.post_id
  WHERE 
    CASE 
      -- If show_all_posts is true, return everything
      WHEN show_all_posts = true THEN true
      
      -- Always show posts with 'all' scope (no specific location targeting)
      WHEN cp.location_scope = 'all' THEN true
      
      -- For neighborhood view, show neighborhood-scoped posts that match exactly
      WHEN user_neighborhood IS NOT NULL AND user_city IS NOT NULL AND user_state IS NOT NULL THEN
        (cp.location_scope = 'neighborhood' 
         AND cp.target_neighborhood = user_neighborhood 
         AND cp.target_city = user_city 
         AND cp.target_state = user_state)
      
      -- For city view, show city-scoped posts that match exactly
      WHEN user_city IS NOT NULL AND user_state IS NOT NULL THEN
        (cp.location_scope = 'city' 
         AND cp.target_city = user_city 
         AND cp.target_state = user_state)
      
      -- For state view, show state-scoped posts that match exactly
      WHEN user_state IS NOT NULL THEN
        (cp.location_scope = 'state' 
         AND cp.target_state = user_state)
      
      -- Default: if no location parameters provided, show 'all' posts
      ELSE cp.location_scope = 'all'
    END
  ORDER BY cp.created_at DESC
  LIMIT post_limit
  OFFSET post_offset;
END;
$function$;