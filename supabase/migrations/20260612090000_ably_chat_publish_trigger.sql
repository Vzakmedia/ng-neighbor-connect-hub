-- Ably chat delivery layer (primary), Supabase Realtime stays as fallback.
--
-- Publishes direct_messages events to per-user Ably channels via pg_net.
-- The client subscribes to chat:{their user id} (subscribe-only token from
-- the ably-token edge function) and dedupes against the existing Supabase
-- postgres_changes events, so dual delivery is harmless and either side
-- can fail without breaking chat.
--
-- REQUIRED ONE-TIME SETUP — run in the Supabase SQL Editor:
--   SELECT vault.create_secret('YOUR_ABLY_API_KEY', 'ably_api_key');
-- (Dashboard → ably.com → your app → API keys; use a key with publish
--  capability on the chat:* namespace.)
--
-- Until the secret is set, this trigger no-ops silently.

CREATE SCHEMA IF NOT EXISTS internal;

-- ─── Helper: publish one event to a user's Ably chat channel ─────────────────

CREATE OR REPLACE FUNCTION internal.ably_publish_chat(
  p_user_id    uuid,
  p_event_name text,
  p_payload    jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_key text;
BEGIN
  BEGIN
    SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets
    WHERE name = 'ably_api_key'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RETURN; -- Vault not configured — Supabase Realtime remains the only path
  END;

  IF v_key IS NULL OR v_key = '' THEN
    RETURN;
  END IF;

  BEGIN
    PERFORM net.http_post(
      -- ':' in the channel name must be percent-encoded in the REST path
      url     := 'https://rest.ably.io/channels/chat%3A' || p_user_id::text || '/messages',
      headers := jsonb_build_object(
                   'Content-Type',  'application/json',
                   'Authorization', 'Basic ' || replace(encode(convert_to(v_key, 'utf8'), 'base64'), E'\n', '')
                 ),
      body    := jsonb_build_object(
                   'name', p_event_name,
                   'data', p_payload
                 )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Delivery acceleration must never break the write itself
    RAISE WARNING 'ably_publish_chat failed: %', SQLERRM;
  END;
END;
$$;

-- ─── Trigger: fan out message inserts and status updates ─────────────────────

CREATE OR REPLACE FUNCTION internal.publish_chat_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_row jsonb;
BEGIN
  v_row := to_jsonb(NEW);

  IF TG_OP = 'INSERT' THEN
    -- Recipient gets the new message instantly; sender gets their
    -- own-message confirmation (matches the two Supabase subscriptions).
    PERFORM internal.ably_publish_chat(NEW.recipient_id, 'new_message', v_row);
    IF NEW.sender_id IS DISTINCT FROM NEW.recipient_id THEN
      PERFORM internal.ably_publish_chat(NEW.sender_id, 'new_message', v_row);
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Only fan out meaningful status changes (delivered/read receipts)
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.read_at IS DISTINCT FROM OLD.read_at THEN
      PERFORM internal.ably_publish_chat(NEW.sender_id, 'message_updated', v_row);
      IF NEW.sender_id IS DISTINCT FROM NEW.recipient_id THEN
        PERFORM internal.ably_publish_chat(NEW.recipient_id, 'message_updated', v_row);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'publish_chat_event failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ably_publish_on_message ON public.direct_messages;
CREATE TRIGGER ably_publish_on_message
  AFTER INSERT OR UPDATE ON public.direct_messages
  FOR EACH ROW EXECUTE FUNCTION internal.publish_chat_event();
