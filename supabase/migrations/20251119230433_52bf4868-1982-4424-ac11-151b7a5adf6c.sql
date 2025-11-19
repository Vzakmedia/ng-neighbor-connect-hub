-- Update the create_conversation_with_request_check function to properly handle marketplace conversations
-- This ensures marketplace conversations are distinct from direct messages even between the same users

DROP FUNCTION IF EXISTS public.create_conversation_with_request_check(uuid, uuid, text, uuid, uuid);

CREATE OR REPLACE FUNCTION public.create_conversation_with_request_check(
  sender_id uuid,
  recipient_id uuid,
  conversation_type text DEFAULT 'direct_message',
  marketplace_item_id uuid DEFAULT NULL,
  marketplace_service_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  existing_conversation_id uuid;
  new_conversation_id uuid;
  has_previous_conversation boolean;
BEGIN
  -- For marketplace conversations, check for existing conversation matching users AND marketplace context
  IF conversation_type = 'marketplace' THEN
    SELECT id INTO existing_conversation_id
    FROM public.direct_conversations
    WHERE ((user1_id = sender_id AND user2_id = recipient_id)
       OR (user1_id = recipient_id AND user2_id = sender_id))
    AND conversation_type = 'marketplace'
    AND (
      (marketplace_item_id IS NOT NULL AND public.direct_conversations.marketplace_item_id = create_conversation_with_request_check.marketplace_item_id)
      OR (marketplace_service_id IS NOT NULL AND public.direct_conversations.marketplace_service_id = create_conversation_with_request_check.marketplace_service_id)
    );
    
    IF existing_conversation_id IS NOT NULL THEN
      RETURN existing_conversation_id;
    END IF;
  ELSE
    -- For direct messages, check for existing direct message conversation
    SELECT id INTO existing_conversation_id
    FROM public.direct_conversations
    WHERE ((user1_id = sender_id AND user2_id = recipient_id)
       OR (user1_id = recipient_id AND user2_id = sender_id))
    AND (conversation_type = 'direct_message' OR conversation_type IS NULL);
    
    IF existing_conversation_id IS NOT NULL THEN
      RETURN existing_conversation_id;
    END IF;
  END IF;
  
  -- Check if users have had previous accepted conversations
  SELECT EXISTS(
    SELECT 1 FROM public.direct_conversations
    WHERE ((user1_id = sender_id AND user2_id = recipient_id) 
           OR (user1_id = recipient_id AND user2_id = sender_id))
    AND (request_status = 'accepted' OR request_status IS NULL)
  ) INTO has_previous_conversation;
  
  -- Create new conversation
  INSERT INTO public.direct_conversations (
    user1_id, 
    user2_id, 
    conversation_type,
    request_status,
    requested_at,
    marketplace_item_id,
    marketplace_service_id,
    user1_has_unread,
    user2_has_unread
  ) VALUES (
    sender_id,
    recipient_id,
    conversation_type,
    CASE 
      WHEN conversation_type = 'marketplace' THEN NULL
      WHEN has_previous_conversation THEN NULL
      ELSE 'pending'
    END,
    CASE 
      WHEN conversation_type = 'marketplace' THEN NULL
      WHEN has_previous_conversation THEN NULL
      ELSE now()
    END,
    marketplace_item_id,
    marketplace_service_id,
    false,
    CASE 
      WHEN conversation_type = 'marketplace' THEN true
      WHEN has_previous_conversation THEN true
      ELSE false
    END
  ) RETURNING id INTO new_conversation_id;
  
  RETURN new_conversation_id;
END;
$$;