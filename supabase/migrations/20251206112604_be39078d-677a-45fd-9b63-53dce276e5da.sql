-- Add full text search support for discussion boards
-- This enables fast text search instead of slow ilike() queries

-- Add search vector column to discussion_boards if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'discussion_boards' 
    AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE public.discussion_boards 
    ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION public.update_discussion_boards_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-update search vector
DROP TRIGGER IF EXISTS update_discussion_boards_search ON public.discussion_boards;
CREATE TRIGGER update_discussion_boards_search
  BEFORE INSERT OR UPDATE ON public.discussion_boards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_discussion_boards_search_vector();

-- Backfill existing records
UPDATE public.discussion_boards 
SET search_vector = 
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(location, '')), 'C')
WHERE search_vector IS NULL;

-- Create GIN index for fast full text search
DROP INDEX IF EXISTS idx_discussion_boards_search;
CREATE INDEX idx_discussion_boards_search ON public.discussion_boards USING GIN(search_vector);

-- Create index on location for exact match queries (replacing ilike)
DROP INDEX IF EXISTS idx_discussion_boards_location;
CREATE INDEX idx_discussion_boards_location ON public.discussion_boards(location);

-- Create composite index for common filter patterns
DROP INDEX IF EXISTS idx_discussion_boards_location_scope;
CREATE INDEX idx_discussion_boards_location_scope ON public.discussion_boards(is_public, location_scope, location);

-- Add search vector to community_posts for future search functionality
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'community_posts' 
    AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE public.community_posts 
    ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- Create function to update community posts search vector
CREATE OR REPLACE FUNCTION public.update_community_posts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-update search vector for community posts
DROP TRIGGER IF EXISTS update_community_posts_search ON public.community_posts;
CREATE TRIGGER update_community_posts_search
  BEFORE INSERT OR UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_posts_search_vector();

-- Backfill existing community posts
UPDATE public.community_posts 
SET search_vector = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'B')
WHERE search_vector IS NULL;

-- Create GIN index for community posts search
DROP INDEX IF EXISTS idx_community_posts_search;
CREATE INDEX idx_community_posts_search ON public.community_posts USING GIN(search_vector);

-- Create a helper function for full text search
CREATE OR REPLACE FUNCTION public.search_discussion_boards(
  search_query text,
  location_scope_filter text DEFAULT NULL,
  is_public_filter boolean DEFAULT true
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  location text,
  location_scope text,
  is_public boolean,
  created_at timestamptz,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    db.id,
    db.name,
    db.description,
    db.location,
    db.location_scope,
    db.is_public,
    db.created_at,
    ts_rank(db.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM public.discussion_boards db
  WHERE 
    db.search_vector @@ plainto_tsquery('english', search_query)
    AND (location_scope_filter IS NULL OR db.location_scope = location_scope_filter)
    AND (is_public_filter IS NULL OR db.is_public = is_public_filter)
  ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.search_discussion_boards TO authenticated;