-- Add columns required by useFeedRecommendations and useRecommendations queries.
-- The recommendations table was created via the Supabase dashboard without these
-- fields, causing 400 errors when the client tried to filter or sort on them.

ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_likes INTEGER DEFAULT 0;

-- Index for the feed query's sort + filter
CREATE INDEX IF NOT EXISTS idx_recommendations_feed
  ON public.recommendations (status, average_rating DESC, total_likes DESC);

-- Keep total_likes in sync with the recommendation_likes table.
CREATE OR REPLACE FUNCTION public.sync_recommendation_like_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.recommendations
       SET total_likes = total_likes + 1
     WHERE id = NEW.recommendation_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.recommendations
       SET total_likes = GREATEST(total_likes - 1, 0)
     WHERE id = OLD.recommendation_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_recommendation_likes ON public.recommendation_likes;
CREATE TRIGGER trg_sync_recommendation_likes
  AFTER INSERT OR DELETE ON public.recommendation_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_recommendation_like_count();

-- Back-fill total_likes for any existing rows.
UPDATE public.recommendations r
   SET total_likes = (
     SELECT COUNT(*) FROM public.recommendation_likes l
      WHERE l.recommendation_id = r.id
   );
