-- Enable real-time functionality for messaging tables

-- Enable replica identity full for direct_conversations table
ALTER TABLE public.direct_conversations REPLICA IDENTITY FULL;

-- Enable replica identity full for direct_messages table  
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;

-- Add tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;