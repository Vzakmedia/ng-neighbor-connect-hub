-- Create trigger to automatically update message delivery status
CREATE OR REPLACE FUNCTION public.update_message_delivery_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When a user reads messages, mark previous unread messages as delivered first
  IF TG_OP = 'UPDATE' AND OLD.status != 'read' AND NEW.status = 'read' THEN
    -- Update any 'sent' messages from the same sender to 'delivered'
    UPDATE public.direct_messages
    SET status = 'delivered', updated_at = now()
    WHERE recipient_id = NEW.recipient_id
      AND sender_id = NEW.sender_id  
      AND status = 'sent'
      AND created_at < NEW.created_at;
  END IF;
  
  -- Auto-mark as delivered when conversation is accessed/read
  IF TG_OP = 'INSERT' THEN
    -- Set initial status as 'sent'
    NEW.status = 'sent';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for message status updates
DROP TRIGGER IF EXISTS trigger_update_message_delivery_status ON public.direct_messages;
CREATE TRIGGER trigger_update_message_delivery_status
  BEFORE INSERT OR UPDATE ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_message_delivery_status();

-- Function to mark messages as delivered when user comes online/reads conversation
CREATE OR REPLACE FUNCTION public.mark_messages_as_delivered(recipient_user_id uuid, sender_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update 'sent' messages to 'delivered' when recipient is active
  UPDATE public.direct_messages
  SET status = 'delivered', updated_at = now()
  WHERE recipient_id = recipient_user_id
    AND sender_id = sender_user_id
    AND status = 'sent';
END;
$$;