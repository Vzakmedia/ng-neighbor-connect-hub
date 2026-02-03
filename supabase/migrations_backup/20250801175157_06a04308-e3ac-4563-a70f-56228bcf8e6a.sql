-- Create function to mark individual messages as read
CREATE OR REPLACE FUNCTION public.mark_message_as_read(message_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update message status to 'read' if user is the recipient
  UPDATE public.direct_messages
  SET status = 'read', updated_at = now()
  WHERE id = message_id
    AND recipient_id = auth.uid()
    AND status != 'read';
  
  -- Also mark any earlier unread messages from the same sender as 'delivered'
  UPDATE public.direct_messages
  SET status = 'delivered', updated_at = now()
  WHERE recipient_id = auth.uid()
    AND sender_id = (SELECT sender_id FROM public.direct_messages WHERE id = message_id)
    AND status = 'sent'
    AND created_at < (SELECT created_at FROM public.direct_messages WHERE id = message_id);
  
  RETURN true;
END;
$$;

-- Update the existing mark_direct_messages_as_read function to also update status
CREATE OR REPLACE FUNCTION public.mark_direct_messages_as_read(conversation_id uuid, current_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    conv_record RECORD;
    other_user_id uuid;
BEGIN
    -- Get conversation
    SELECT * INTO conv_record FROM public.direct_conversations WHERE id = conversation_id;
    
    -- Determine the other user
    IF conv_record.user1_id = current_user_id THEN
        other_user_id := conv_record.user2_id;
    ELSE
        other_user_id := conv_record.user1_id;
    END IF;
    
    -- Update message status to 'read' for messages received by current user
    UPDATE public.direct_messages
    SET status = 'read', updated_at = now()
    WHERE recipient_id = current_user_id
      AND sender_id = other_user_id
      AND status != 'read';
    
    -- Update conversation unread status
    UPDATE public.direct_conversations
    SET 
        user1_has_unread = CASE WHEN user1_id = current_user_id THEN false ELSE user1_has_unread END,
        user2_has_unread = CASE WHEN user2_id = current_user_id THEN false ELSE user2_has_unread END,
        updated_at = now()
    WHERE id = conversation_id;
END;
$$;