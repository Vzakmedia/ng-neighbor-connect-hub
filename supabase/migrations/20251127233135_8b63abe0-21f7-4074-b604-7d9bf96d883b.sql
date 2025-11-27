-- Add receipt timestamp columns to direct_messages
ALTER TABLE public.direct_messages 
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_delivered_at ON public.direct_messages(delivered_at);
CREATE INDEX IF NOT EXISTS idx_direct_messages_read_at ON public.direct_messages(read_at);

-- Add last_seen column to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for last_seen
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen);

-- Create or replace function to update last_seen on user activity
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET last_seen = NOW()
  WHERE user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update last_seen on direct_messages insert
DROP TRIGGER IF EXISTS trigger_update_last_seen_on_message ON public.direct_messages;
CREATE TRIGGER trigger_update_last_seen_on_message
  AFTER INSERT ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_last_seen();

-- Update mark_messages_delivered RPC to set delivered_at timestamp
CREATE OR REPLACE FUNCTION mark_messages_delivered(recipient_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE direct_messages
  SET 
    status = 'delivered',
    delivered_at = NOW()
  WHERE recipient_id = recipient_user_id
    AND status = 'sent'
    AND delivered_at IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Drop and recreate mark_message_as_read to change return type to void
DROP FUNCTION IF EXISTS mark_message_as_read(uuid);
CREATE FUNCTION mark_message_as_read(message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE direct_messages
  SET 
    status = 'read',
    read_at = NOW()
  WHERE id = message_id
    AND recipient_id = auth.uid()
    AND status != 'read';
END;
$$;

-- Update mark_direct_messages_as_read RPC to set read_at timestamp
CREATE OR REPLACE FUNCTION mark_direct_messages_as_read(
  conversation_id uuid,
  current_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark all unread messages in this conversation as read
  UPDATE direct_messages
  SET 
    status = 'read',
    read_at = NOW()
  WHERE recipient_id = current_user_id
    AND status != 'read'
    AND (
      (sender_id IN (
        SELECT user1_id FROM direct_conversations WHERE id = conversation_id
        UNION
        SELECT user2_id FROM direct_conversations WHERE id = conversation_id
      ))
    );
END;
$$;