-- Update the mark_direct_messages_as_read function to also clear unread flags
CREATE OR REPLACE FUNCTION mark_direct_messages_as_read(conversation_id UUID, current_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Mark all unread messages in this conversation as read
  UPDATE direct_messages
  SET 
    status = 'read',
    read_at = NOW()
  WHERE recipient_id = current_user_id
    AND status != 'read'
    AND sender_id IN (
      SELECT user1_id FROM direct_conversations WHERE id = conversation_id
      UNION
      SELECT user2_id FROM direct_conversations WHERE id = conversation_id
    );

  -- Clear the unread flag for the current user in the conversation
  UPDATE direct_conversations
  SET 
    user1_has_unread = CASE WHEN user1_id = current_user_id THEN false ELSE user1_has_unread END,
    user2_has_unread = CASE WHEN user2_id = current_user_id THEN false ELSE user2_has_unread END,
    updated_at = NOW()
  WHERE id = conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to set unread flags when new messages are inserted
CREATE OR REPLACE FUNCTION update_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE direct_conversations
  SET 
    last_message_at = NOW(),
    user1_has_unread = CASE WHEN user1_id = NEW.recipient_id THEN true ELSE user1_has_unread END,
    user2_has_unread = CASE WHEN user2_id = NEW.recipient_id THEN true ELSE user2_has_unread END,
    updated_at = NOW()
  WHERE (user1_id = NEW.sender_id AND user2_id = NEW.recipient_id)
     OR (user1_id = NEW.recipient_id AND user2_id = NEW.sender_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_update_conversation_on_new_message ON direct_messages;

CREATE TRIGGER trigger_update_conversation_on_new_message
  AFTER INSERT ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_new_message();