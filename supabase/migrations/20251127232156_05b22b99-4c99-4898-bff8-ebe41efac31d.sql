-- Enable full row data for realtime updates on direct_messages
-- This allows UPDATE and DELETE events to include complete row information
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;

-- Verify the table is in the realtime publication
-- (This should already be configured, but we ensure it here)
DO $$
BEGIN
  -- Check if table is already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'direct_messages'
  ) THEN
    -- Add table to realtime publication if not already there
    ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
  END IF;
END $$;