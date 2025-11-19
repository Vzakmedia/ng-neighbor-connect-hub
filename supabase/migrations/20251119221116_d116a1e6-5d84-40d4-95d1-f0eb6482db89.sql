-- Update existing conversations that have marketplace references to be marked as marketplace type
UPDATE direct_conversations 
SET conversation_type = 'marketplace'
WHERE (marketplace_item_id IS NOT NULL OR marketplace_service_id IS NOT NULL)
  AND (conversation_type IS NULL OR conversation_type != 'marketplace');

-- Create a function to automatically set conversation type based on marketplace references
CREATE OR REPLACE FUNCTION set_conversation_type()
RETURNS TRIGGER AS $$
BEGIN
  -- If the conversation has marketplace item or service references, mark it as marketplace
  IF (NEW.marketplace_item_id IS NOT NULL OR NEW.marketplace_service_id IS NOT NULL) THEN
    NEW.conversation_type = 'marketplace';
  -- Otherwise, if no type is set and it's not marketplace-related, default to direct_message
  ELSIF NEW.conversation_type IS NULL THEN
    NEW.conversation_type = 'direct_message';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run before insert or update on direct_conversations
DROP TRIGGER IF EXISTS trigger_set_conversation_type ON direct_conversations;
CREATE TRIGGER trigger_set_conversation_type
  BEFORE INSERT OR UPDATE ON direct_conversations
  FOR EACH ROW
  EXECUTE FUNCTION set_conversation_type();