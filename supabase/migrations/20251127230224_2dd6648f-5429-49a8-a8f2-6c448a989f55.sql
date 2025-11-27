-- Fix search_path security warning for mark_messages_delivered function
CREATE OR REPLACE FUNCTION mark_messages_delivered(recipient_user_id UUID)
RETURNS INT AS $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE public.direct_messages
  SET status = 'delivered', updated_at = now()
  WHERE recipient_id = recipient_user_id
    AND status = 'sent';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION mark_messages_delivered IS 'Marks all sent messages for a recipient as delivered when they open the app';
