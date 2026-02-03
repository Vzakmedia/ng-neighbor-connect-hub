-- Fix board_posts table to support messaging features
ALTER TABLE board_posts 
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'message',
ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS thread_id uuid REFERENCES board_posts(id);

-- Create proper foreign key relationship from board_posts to profiles
ALTER TABLE board_posts 
DROP CONSTRAINT IF EXISTS board_posts_user_id_fkey;

ALTER TABLE board_posts 
ADD CONSTRAINT board_posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Ensure board_post_reactions table has proper indexes
CREATE INDEX IF NOT EXISTS idx_board_post_reactions_post_id ON board_post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_board_post_reactions_user_id ON board_post_reactions(user_id);

-- Ensure board_posts table has proper indexes for messaging
CREATE INDEX IF NOT EXISTS idx_board_posts_board_id_created_at ON board_posts(board_id, created_at);
CREATE INDEX IF NOT EXISTS idx_board_posts_is_pinned ON board_posts(is_pinned) WHERE is_pinned = true;

-- Add function to handle message editing
CREATE OR REPLACE FUNCTION update_board_post_edited_at()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.content != NEW.content THEN
        NEW.edited_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message editing
DROP TRIGGER IF EXISTS board_post_edited_trigger ON board_posts;
CREATE TRIGGER board_post_edited_trigger
    BEFORE UPDATE ON board_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_board_post_edited_at();

-- Ensure realtime is properly configured (table is already in publication)
ALTER TABLE board_posts REPLICA IDENTITY FULL;