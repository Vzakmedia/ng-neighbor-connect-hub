-- Ensure call_signaling table has replica identity and is added to realtime publication
ALTER TABLE public.call_signaling REPLICA IDENTITY FULL;

-- Add call_signaling to realtime publication if not already added
DO $$
BEGIN
    -- Check if the table is already in the publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'call_signaling'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signaling;
    END IF;
END
$$;