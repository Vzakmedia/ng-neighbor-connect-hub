-- Add DELETE policies for direct messages and conversations
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Allow users to delete messages they sent
CREATE POLICY "Users can delete their own messages" ON public.direct_messages
FOR DELETE
USING (auth.uid() = sender_id);

-- Allow users to delete conversations they're part of
CREATE POLICY "Users can delete their conversations" ON public.direct_conversations
FOR DELETE
USING ((auth.uid() = user1_id) OR (auth.uid() = user2_id));

-- Function to delete multiple messages at once
CREATE OR REPLACE FUNCTION public.delete_messages(message_ids uuid[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete messages where user is the sender
  DELETE FROM public.direct_messages 
  WHERE id = ANY(message_ids) 
  AND sender_id = auth.uid();
  
  RETURN true;
END;
$$;

-- Function to delete entire conversation and all its messages
CREATE OR REPLACE FUNCTION public.delete_conversation(conversation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  conv_record RECORD;
BEGIN
  -- Get conversation to verify user has access
  SELECT * INTO conv_record
  FROM public.direct_conversations
  WHERE id = conversation_id
  AND ((user1_id = auth.uid()) OR (user2_id = auth.uid()));
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversation not found or access denied';
  END IF;
  
  -- Delete all messages in the conversation
  DELETE FROM public.direct_messages
  WHERE (sender_id = conv_record.user1_id AND recipient_id = conv_record.user2_id)
     OR (sender_id = conv_record.user2_id AND recipient_id = conv_record.user1_id);
  
  -- Delete the conversation
  DELETE FROM public.direct_conversations
  WHERE id = conversation_id;
  
  RETURN true;
END;
$$;

-- Function to soft delete messages (mark as deleted instead of removing)
CREATE OR REPLACE FUNCTION public.soft_delete_messages(message_ids uuid[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Mark messages as deleted where user is the sender
  UPDATE public.direct_messages 
  SET is_deleted = true
  WHERE id = ANY(message_ids) 
  AND sender_id = auth.uid();
  
  RETURN true;
END;
$$;