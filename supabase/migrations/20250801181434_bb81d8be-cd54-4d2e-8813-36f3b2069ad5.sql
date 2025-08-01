-- Enable real-time for direct_messages and direct_conversations tables
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
ALTER TABLE public.direct_conversations REPLICA IDENTITY FULL;

-- Add the tables to the publication for real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_conversations;