-- Fix read receipts (double tick) in direct messages.
--
-- Root cause: the only UPDATE RLS policy on direct_messages is
-- "Users can update messages they sent" (USING auth.uid() = sender_id).
-- Marking a message as read is done by the RECIPIENT, so those updates
-- silently affected 0 rows: read_at was never persisted and the sender's
-- realtime UPDATE subscription never fired.
--
-- Fix: SECURITY DEFINER functions that allow a recipient to mark only
-- their own received messages as read. Direct table updates by recipients
-- remain blocked by RLS.

-- Recreate (not REPLACE) because historical versions of this function had a
-- different return type, and CREATE OR REPLACE cannot change return types.
DROP FUNCTION IF EXISTS public.mark_message_as_read(uuid);

CREATE FUNCTION public.mark_message_as_read(message_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.direct_messages
  SET status = 'read',
      read_at = now(),
      updated_at = now()
  WHERE id = message_id
    AND recipient_id = auth.uid()
    AND status IS DISTINCT FROM 'read';

  RETURN FOUND;
END;
$$;

-- Bulk variant: mark every unread message from one sender to the current
-- user as read (used when opening a conversation).
DROP FUNCTION IF EXISTS public.mark_conversation_read(uuid);

CREATE FUNCTION public.mark_conversation_read(other_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.direct_messages
  SET status = 'read',
      read_at = now(),
      updated_at = now()
  WHERE recipient_id = auth.uid()
    AND sender_id = other_user_id
    AND status IS DISTINCT FROM 'read';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_message_as_read(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.mark_conversation_read(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.mark_message_as_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated;

-- The sender's UI learns about read/delivered status via postgres_changes
-- UPDATE events. Make sure direct_messages publishes UPDATEs with full row
-- data and is part of the realtime publication (both idempotent).
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'direct_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
  END IF;
END $$;
