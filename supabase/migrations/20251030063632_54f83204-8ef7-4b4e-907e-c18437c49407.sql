-- Update get_feed function to accept min_created_at parameter for new user clean slate
DROP FUNCTION IF EXISTS public.get_feed(uuid, text, int, timestamp with time zone);

CREATE OR REPLACE FUNCTION public.get_feed(
  target_user_id uuid,
  filter_level text,
  limit_count int DEFAULT 50,
  cursor timestamp with time zone DEFAULT NULL,
  min_created_at timestamp with time zone DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  content text,
  title text,
  image_urls text[],
  tags text[],
  location text,
  location_scope text,
  target_neighborhood text,
  target_city text,
  target_state text,
  rsvp_enabled boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  author_name text,
  author_avatar text,
  likes_count bigint,
  comments_count bigint
) AS $$
DECLARE
  user_neighborhood text;
  user_city text;
  user_state text;
BEGIN
  -- Get user location from profile
  SELECT p.neighborhood, p.city, p.state
  INTO user_neighborhood, user_city, user_state
  FROM profiles p
  WHERE p.user_id = target_user_id;

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
    COALESCE((SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = cp.id), 0) as likes_count,
    COALESCE((SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = cp.id), 0) as comments_count
  FROM community_posts cp
  LEFT JOIN profiles p ON cp.user_id = p.user_id
  WHERE
    -- Location filtering
    (
      (filter_level = 'neighborhood' AND cp.target_neighborhood = user_neighborhood) OR
      (filter_level = 'city' AND cp.target_city = user_city) OR
      (filter_level = 'state' AND cp.target_state = user_state) OR
      (filter_level = 'all')
    )
    -- NEW: Filter by minimum creation date for new users
    AND (min_created_at IS NULL OR cp.created_at >= min_created_at)
    -- Cursor pagination
    AND (cursor IS NULL OR cp.created_at < cursor)
  ORDER BY cp.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create board_memberships table for tracking when users join boards
CREATE TABLE IF NOT EXISTS public.board_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(board_id, user_id)
);

-- Enable RLS
ALTER TABLE public.board_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for board_memberships
CREATE POLICY "Users can view their own memberships"
  ON public.board_memberships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join boards"
  ON public.board_memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave boards"
  ON public.board_memberships FOR DELETE
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_board_memberships_board_id ON public.board_memberships(board_id);
CREATE INDEX IF NOT EXISTS idx_board_memberships_user_id ON public.board_memberships(user_id);