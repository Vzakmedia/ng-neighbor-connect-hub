-- Enable realtime for board_posts table
ALTER TABLE public.board_posts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_posts;