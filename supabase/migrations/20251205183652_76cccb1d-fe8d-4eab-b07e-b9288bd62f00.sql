-- Add denormalized count columns to community_posts for performance
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0;

-- Create function to update likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update saves count
CREATE OR REPLACE FUNCTION update_post_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET saves_count = saves_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET saves_count = GREATEST(saves_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON post_likes;
DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON post_comments;
DROP TRIGGER IF EXISTS trigger_update_post_saves_count ON saved_posts;

-- Create triggers
CREATE TRIGGER trigger_update_post_likes_count
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER trigger_update_post_comments_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

CREATE TRIGGER trigger_update_post_saves_count
AFTER INSERT OR DELETE ON saved_posts
FOR EACH ROW EXECUTE FUNCTION update_post_saves_count();

-- Backfill existing counts
UPDATE community_posts cp SET
  likes_count = COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_id = cp.id), 0),
  comments_count = COALESCE((SELECT COUNT(*) FROM post_comments WHERE post_id = cp.id), 0),
  saves_count = COALESCE((SELECT COUNT(*) FROM saved_posts WHERE post_id = cp.id), 0);

-- Create estimated count function for admin dashboards
CREATE OR REPLACE FUNCTION get_estimated_count(table_name TEXT)
RETURNS BIGINT AS $$
  SELECT COALESCE(reltuples::BIGINT, 0) FROM pg_class WHERE relname = table_name;
$$ LANGUAGE sql SECURITY DEFINER;

-- Add GIN indexes for frequently filtered JSONB columns
CREATE INDEX IF NOT EXISTS idx_businesses_operating_hours ON businesses USING GIN(operating_hours);
CREATE INDEX IF NOT EXISTS idx_analytics_event_data ON analytics_events USING GIN(event_data);
CREATE INDEX IF NOT EXISTS idx_community_posts_file_urls ON community_posts USING GIN(file_urls);

-- Add index for faster user engagement lookups
CREATE INDEX IF NOT EXISTS idx_post_likes_user_post ON post_likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_post ON saved_posts(user_id, post_id);