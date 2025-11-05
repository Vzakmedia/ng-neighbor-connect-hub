-- Create post_views table to track user viewing behavior
CREATE TABLE IF NOT EXISTS public.post_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  view_duration_seconds INTEGER DEFAULT 0,
  UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- Users can insert their own views
CREATE POLICY "Users can track their own post views"
ON public.post_views
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own viewing history
CREATE POLICY "Users can view their own post views"
ON public.post_views
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_post_views_user_id ON public.post_views(user_id);
CREATE INDEX idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX idx_post_views_viewed_at ON public.post_views(viewed_at DESC);

-- Create function to get user engagement stats
CREATE OR REPLACE FUNCTION get_user_engagement_stats(p_user_id UUID)
RETURNS TABLE (
  liked_tags TEXT[],
  saved_tags TEXT[],
  viewed_tags TEXT[],
  preferred_locations TEXT[],
  engagement_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH liked_posts AS (
    SELECT UNNEST(cp.tags) as tag, COUNT(*) as count
    FROM community_post_likes cpl
    JOIN community_posts cp ON cpl.post_id = cp.id
    WHERE cpl.user_id = p_user_id
    GROUP BY tag
    ORDER BY count DESC
    LIMIT 10
  ),
  saved_posts AS (
    SELECT UNNEST(cp.tags) as tag, COUNT(*) as count
    FROM community_post_saves cps
    JOIN community_posts cp ON cps.post_id = cp.id
    WHERE cps.user_id = p_user_id
    GROUP BY tag
    ORDER BY count DESC
    LIMIT 10
  ),
  viewed_posts AS (
    SELECT UNNEST(cp.tags) as tag, COUNT(*) as count
    FROM post_views pv
    JOIN community_posts cp ON pv.post_id = cp.id
    WHERE pv.user_id = p_user_id
    AND pv.viewed_at > NOW() - INTERVAL '30 days'
    GROUP BY tag
    ORDER BY count DESC
    LIMIT 10
  ),
  location_prefs AS (
    SELECT cp.location, COUNT(*) as count
    FROM post_views pv
    JOIN community_posts cp ON pv.post_id = cp.id
    WHERE pv.user_id = p_user_id
    AND pv.viewed_at > NOW() - INTERVAL '30 days'
    AND cp.location IS NOT NULL
    GROUP BY cp.location
    ORDER BY count DESC
    LIMIT 5
  )
  SELECT
    ARRAY(SELECT tag FROM liked_posts) as liked_tags,
    ARRAY(SELECT tag FROM saved_posts) as saved_tags,
    ARRAY(SELECT tag FROM viewed_posts) as viewed_tags,
    ARRAY(SELECT location FROM location_prefs) as preferred_locations,
    (
      (SELECT COUNT(*) FROM community_post_likes WHERE user_id = p_user_id) * 3 +
      (SELECT COUNT(*) FROM community_post_saves WHERE user_id = p_user_id) * 5 +
      (SELECT COUNT(*) FROM community_post_comments WHERE user_id = p_user_id) * 2
    )::NUMERIC as engagement_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;