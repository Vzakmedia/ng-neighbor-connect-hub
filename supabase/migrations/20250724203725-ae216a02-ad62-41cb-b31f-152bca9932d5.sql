-- Add tags column to community_posts table
ALTER TABLE public.community_posts 
ADD COLUMN tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add index for better performance when filtering by tags
CREATE INDEX idx_community_posts_tags ON public.community_posts USING GIN(tags);