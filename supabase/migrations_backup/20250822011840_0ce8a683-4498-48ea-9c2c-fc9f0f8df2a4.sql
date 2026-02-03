-- Add board_post_reactions to realtime (only this table)
ALTER TABLE public.board_post_reactions REPLICA IDENTITY FULL;