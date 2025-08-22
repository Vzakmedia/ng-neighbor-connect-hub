-- Add tagged_members column to store user IDs of mentioned users
ALTER TABLE public.board_posts ADD COLUMN tagged_members UUID[] DEFAULT '{}';

-- Add index for better performance when querying tagged posts
CREATE INDEX idx_board_posts_tagged_members ON public.board_posts USING GIN(tagged_members);