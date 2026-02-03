-- Add parent_comment_id column to post_comments table for nested comments/replies
ALTER TABLE public.post_comments 
ADD COLUMN parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE;

-- Add index for better performance when querying nested comments
CREATE INDEX idx_post_comments_parent_id ON public.post_comments(parent_comment_id);

-- Add index for better performance when querying comments by post
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);