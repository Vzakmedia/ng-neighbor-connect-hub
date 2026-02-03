-- Ensure direct_messages has proper replica identity for realtime
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;