-- Enable real-time for direct_messages and direct_conversations tables
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
ALTER TABLE public.direct_conversations REPLICA IDENTITY FULL;

-- Add tables to the real-time publication
SELECT pg_publication_tables FROM pg_publication WHERE pubname = 'supabase_realtime';

-- Add the tables to the publication if not already added
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_conversations;