-- Set replica identity for real-time functionality (if not already set)

-- Check and set replica identity for direct_conversations if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'direct_conversations' 
    AND n.nspname = 'public'
    AND c.relreplident = 'f'
  ) THEN
    ALTER TABLE public.direct_conversations REPLICA IDENTITY FULL;
  END IF;
END
$$;

-- Check and set replica identity for direct_messages if needed  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'direct_messages'
    AND n.nspname = 'public' 
    AND c.relreplident = 'f'
  ) THEN
    ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
  END IF;
END
$$;