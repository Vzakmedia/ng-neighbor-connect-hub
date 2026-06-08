-- Fix: internal.notify_on_direct_message() referenced NEW.conversation_id, but
-- the direct_messages table has no such column (it uses sender_id / recipient_id).
-- This caused a PostgreSQL 42703 "record new has no field conversation_id" error
-- that rolled back every message INSERT, making sending messages impossible.
--
-- Fix: look up the conversation ID from direct_conversations (matched by the two
-- participant IDs), and add EXCEPTION WHEN OTHERS THEN RETURN NEW so that any
-- future notification failure never blocks message delivery.

CREATE OR REPLACE FUNCTION internal.notify_on_direct_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sender_name    text;
  v_preview        text;
  v_conversation_id uuid;
BEGIN
  IF NEW.recipient_id IS NULL OR NEW.recipient_id = NEW.sender_id THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO v_sender_name
  FROM public.profiles
  WHERE user_id = NEW.sender_id;

  v_preview := left(COALESCE(NEW.content, ''), 80);

  -- Resolve the conversation ID from the participants table.
  -- direct_conversations stores participants as user1_id / user2_id with no
  -- guaranteed ordering, so check both orderings.
  SELECT id INTO v_conversation_id
  FROM public.direct_conversations
  WHERE (user1_id = NEW.sender_id AND user2_id = NEW.recipient_id)
     OR (user1_id = NEW.recipient_id AND user2_id = NEW.sender_id)
  LIMIT 1;

  PERFORM internal.fire_push_notification(
    NEW.recipient_id,
    COALESCE(v_sender_name, 'New Message'),
    v_preview,
    'message',
    jsonb_build_object(
      'sender_id',       NEW.sender_id,
      'message_id',      NEW.id,
      'conversation_id', v_conversation_id,
      'type',            'direct_message'
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never let a push notification error roll back a message insert.
  RETURN NEW;
END;
$$;
