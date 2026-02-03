-- Enable realtime for direct_messages table
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;

-- Add direct_messages to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;