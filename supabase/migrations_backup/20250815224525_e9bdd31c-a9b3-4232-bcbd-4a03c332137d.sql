-- Add message request functionality
ALTER TABLE public.direct_conversations 
ADD COLUMN conversation_type text DEFAULT 'direct_message'::text CHECK (conversation_type IN ('direct_message', 'marketplace', 'message_request')),
ADD COLUMN request_status text DEFAULT NULL CHECK (request_status IN ('pending', 'accepted', 'declined')),
ADD COLUMN requested_at timestamp with time zone DEFAULT NULL,
ADD COLUMN responded_at timestamp with time zone DEFAULT NULL,
ADD COLUMN marketplace_item_id uuid DEFAULT NULL,
ADD COLUMN marketplace_service_id uuid DEFAULT NULL;

-- Create index for better performance
CREATE INDEX idx_direct_conversations_type ON public.direct_conversations(conversation_type);
CREATE INDEX idx_direct_conversations_request_status ON public.direct_conversations(request_status);

-- Update the conversation creation function to handle message requests
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
  -- Check if there's already a conversation between these users
  SELECT id INTO existing_conversation_id
  FROM public.direct_conversations
  WHERE (user1_id = sender_id AND user2_id = recipient_id)
     OR (user1_id = recipient_id AND user2_id = sender_id);
  
  IF existing_conversation_id IS NOT NULL THEN
    RETURN existing_conversation_id;
  END IF;
  
  -- Check if users have had previous conversations (for request logic)
  SELECT EXISTS(
    SELECT 1 FROM public.direct_conversations
    WHERE ((user1_id = sender_id AND user2_id = recipient_id) 
           OR (user1_id = recipient_id AND user2_id = sender_id))
    AND conversation_type = 'direct_message'
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
      ELSE false -- Don't mark as unread for pending requests
    END
  ) RETURNING id INTO new_conversation_id;
  
  RETURN new_conversation_id;
END;
$$;

-- Function to accept/decline message requests
CREATE OR REPLACE FUNCTION public.handle_message_request(
  conversation_id uuid,
  action text -- 'accept' or 'decline'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  conv_record record;
BEGIN
  -- Get conversation and verify user has permission
  SELECT * INTO conv_record
  FROM public.direct_conversations
  WHERE id = conversation_id
  AND user2_id = auth.uid() -- Only recipient can respond
  AND request_status = 'pending';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Update conversation status
  UPDATE public.direct_conversations
  SET 
    request_status = action::text,
    responded_at = now(),
    user2_has_unread = CASE WHEN action = 'accept' THEN user2_has_unread ELSE false END
  WHERE id = conversation_id;
  
  -- If declined, mark any messages as deleted for the recipient
  IF action = 'decline' THEN
    UPDATE public.direct_messages
    SET is_deleted = true
    WHERE (sender_id = conv_record.user1_id AND recipient_id = conv_record.user2_id)
       OR (sender_id = conv_record.user2_id AND recipient_id = conv_record.user1_id);
  END IF;
  
  RETURN true;
END;
$$;