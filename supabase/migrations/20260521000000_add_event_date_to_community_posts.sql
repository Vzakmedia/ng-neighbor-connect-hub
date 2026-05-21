-- Add event_date column to community_posts for event-type posts
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS event_date timestamptz;

-- Index to support ordering events by their scheduled date
CREATE INDEX IF NOT EXISTS idx_community_posts_event_date
  ON public.community_posts (event_date)
  WHERE post_type = 'event';
