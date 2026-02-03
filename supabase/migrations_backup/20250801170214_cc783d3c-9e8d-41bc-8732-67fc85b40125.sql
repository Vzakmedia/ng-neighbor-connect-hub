-- Fix search path issues in the functions
CREATE OR REPLACE FUNCTION public.delete_messages(message_ids uuid[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Delete messages where user is the sender
  DELETE FROM public.direct_messages 
  WHERE id = ANY(message_ids) 
  AND sender_id = auth.uid();
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_conversation(conversation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.soft_delete_messages(message_ids uuid[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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