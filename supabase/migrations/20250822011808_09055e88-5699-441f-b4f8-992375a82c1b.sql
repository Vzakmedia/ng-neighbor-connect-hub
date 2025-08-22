-- Add settings to discussion_boards table for chat restrictions
ALTER TABLE public.discussion_boards 
ADD COLUMN IF NOT EXISTS allow_member_posting boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS require_approval boolean DEFAULT false;

-- Add file attachments support to board_posts
ALTER TABLE public.board_posts 
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

-- Update board_posts to enable realtime if not already done
-- (This might already be done, but ensuring it's set up)
ALTER TABLE public.board_posts REPLICA IDENTITY FULL;

-- Make sure the table is in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_posts;

-- Also add board_post_reactions to realtime for live reaction updates
ALTER TABLE public.board_post_reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_post_reactions;