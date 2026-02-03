-- Enable real-time updates for marketplace_item_likes table
ALTER TABLE marketplace_item_likes REPLICA IDENTITY FULL;

-- Add the table to the supabase_realtime publication to activate real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_item_likes;