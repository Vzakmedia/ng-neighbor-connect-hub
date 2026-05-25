-- Add is_liked and is_saved to get_feed so callers need only one round trip.
-- Previously useFeedQuery fired 3 Supabase calls per page: get_feed + post_likes + saved_posts.
-- Now everything comes back in a single RPC response.

DROP FUNCTION IF EXISTS public.get_feed(uuid, text, int, timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION public.get_feed(
  target_user_id  uuid,
  filter_level    text          DEFAULT 'neighborhood',
  limit_count     int           DEFAULT 20,
  cursor          timestamptz   DEFAULT NULL,
  min_created_at  timestamptz   DEFAULT NULL
) RETURNS TABLE(
  id                    uuid,
  user_id               uuid,
  content               text,
  title                 text,
  image_urls            text[],
  file_urls             jsonb,
  tags                  text[],
  location              text,
  location_scope        text,
  target_neighborhood   text,
  target_city           text,
  target_state          text,
  rsvp_enabled          boolean,
  video_url             text,
  video_thumbnail_url   text,
  created_at            timestamptz,
  updated_at            timestamptz,
  author_name           text,
  author_avatar         text,
  author_is_verified    boolean,
  author_city           text,
  author_state          text,
  likes_count           bigint,
  comments_count        bigint,
  saves_count           bigint,
  is_liked              boolean,
  is_saved              boolean
) LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
DECLARE
  user_neighborhood text;
  user_city         text;
  user_state        text;
BEGIN
  SELECT p.neighborhood, p.city, p.state
    INTO user_neighborhood, user_city, user_state
    FROM public.profiles p
   WHERE p.user_id = target_user_id;

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
    cp.location_scope::text,
    cp.target_neighborhood,
    cp.target_city,
    cp.target_state,
    cp.rsvp_enabled,
    cp.video_url,
    cp.video_thumbnail_url,
    cp.created_at,
    cp.updated_at,
    p.full_name                        AS author_name,
    p.avatar_url                       AS author_avatar,
    COALESCE(p.is_verified, false)     AS author_is_verified,
    p.city                             AS author_city,
    p.state                            AS author_state,
    COALESCE(likes.cnt,    0)          AS likes_count,
    COALESCE(comments.cnt, 0)          AS comments_count,
    COALESCE(saves.cnt,    0)          AS saves_count,
    -- Single EXISTS per post — index-friendly, no separate round trips
    EXISTS (
      SELECT 1 FROM public.post_likes pl
       WHERE pl.post_id = cp.id AND pl.user_id = target_user_id
    )                                  AS is_liked,
    EXISTS (
      SELECT 1 FROM public.saved_posts sp
       WHERE sp.post_id = cp.id AND sp.user_id = target_user_id
    )                                  AS is_saved
  FROM public.community_posts cp
  JOIN public.profiles p ON cp.user_id = p.user_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) AS cnt FROM public.post_likes    GROUP BY post_id
  ) likes    ON cp.id = likes.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) AS cnt FROM public.post_comments GROUP BY post_id
  ) comments ON cp.id = comments.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) AS cnt FROM public.saved_posts   GROUP BY post_id
  ) saves    ON cp.id = saves.post_id
  WHERE
    (cursor IS NULL OR cp.created_at < cursor)
    AND (min_created_at IS NULL OR cp.created_at >= min_created_at)
    AND (
      cp.location_scope = 'all'
      OR (cp.location_scope = 'state'        AND cp.target_state = user_state)
      OR (cp.location_scope = 'city'         AND cp.target_city  = user_city  AND cp.target_state = user_state)
      OR (cp.location_scope = 'neighborhood' AND cp.target_neighborhood = user_neighborhood
                                             AND cp.target_city  = user_city  AND cp.target_state = user_state)
      OR cp.user_id = target_user_id
    )
    AND (
      (filter_level = 'neighborhood' AND p.neighborhood = user_neighborhood AND p.city = user_city AND p.state = user_state)
      OR (filter_level = 'city'      AND p.city  = user_city  AND p.state = user_state)
      OR (filter_level = 'state'     AND p.state = user_state)
      OR filter_level NOT IN ('neighborhood', 'city', 'state')
    )
  ORDER BY cp.created_at DESC
  LIMIT limit_count;
END;
$$;
