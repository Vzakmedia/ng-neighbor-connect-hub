-- Fix functions with mutable search paths by setting them explicitly

-- Fix handle_new_contact_request function
CREATE OR REPLACE FUNCTION public.handle_new_contact_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- This is just a placeholder function
  RETURN NEW;
END;
$$;

-- Fix update_direct_conversation_on_message function
CREATE OR REPLACE FUNCTION public.update_direct_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    conv_record RECORD;
BEGIN
    -- Get or create conversation
    SELECT * INTO conv_record FROM public.direct_conversations 
    WHERE (user1_id = NEW.sender_id AND user2_id = NEW.recipient_id) 
       OR (user1_id = NEW.recipient_id AND user2_id = NEW.sender_id);
    
    IF NOT FOUND THEN
        -- Create new conversation if it doesn't exist
        INSERT INTO public.direct_conversations (user1_id, user2_id, last_message_at, user1_has_unread, user2_has_unread)
        VALUES (NEW.sender_id, NEW.recipient_id, now(), false, true);
    ELSE
        -- Update existing conversation
        UPDATE public.direct_conversations
        SET 
            last_message_at = now(),
            user1_has_unread = CASE 
                                WHEN user1_id = NEW.recipient_id THEN true
                                ELSE user1_has_unread
                               END,
            user2_has_unread = CASE 
                                WHEN user2_id = NEW.recipient_id THEN true
                                ELSE user2_has_unread
                               END
        WHERE id = conv_record.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Fix mark_direct_messages_as_read function
CREATE OR REPLACE FUNCTION public.mark_direct_messages_as_read(conversation_id uuid, current_user_id uuid)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    conv_record RECORD;
BEGIN
    -- Get conversation
    SELECT * INTO conv_record FROM public.direct_conversations WHERE id = conversation_id;
    
    -- Update message status
    UPDATE public.direct_messages
    SET status = 'read'
    WHERE recipient_id = current_user_id
    AND (
        (sender_id = conv_record.user1_id AND recipient_id = conv_record.user2_id)
        OR
        (sender_id = conv_record.user2_id AND recipient_id = conv_record.user1_id)
    )
    AND status != 'read';
    
    -- Update conversation unread status
    UPDATE public.direct_conversations
    SET 
        user1_has_unread = CASE WHEN user1_id = current_user_id THEN false ELSE user1_has_unread END,
        user2_has_unread = CASE WHEN user2_id = current_user_id THEN false ELSE user2_has_unread END
    WHERE id = conversation_id;
END;
$$;

-- Fix user_allows_direct_messages function
CREATE OR REPLACE FUNCTION public.user_allows_direct_messages(user_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    allows_messages BOOLEAN;
BEGIN
    SELECT 
        COALESCE(mp.allow_messages, true) INTO allows_messages
    FROM 
        auth.users u
    LEFT JOIN 
        public.messaging_preferences mp ON u.id = mp.user_id
    WHERE 
        u.id = user_id;
    
    RETURN allows_messages;
END;
$$;