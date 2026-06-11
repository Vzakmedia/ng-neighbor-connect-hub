-- Fix: creating a community post failed with
--   42883: function net.http_post(url => text, headers => jsonb, body => text) does not exist
--
-- Root cause: internal.fire_push_notification cast the request body to ::text,
-- but pg_net's net.http_post only accepts jsonb for body. Every push
-- notification call has been failing with 42883 since. The comment and DM
-- triggers already swallow the error (20260608100000 / 20260608110000), but
-- notify_on_post_like and notify_on_community_post do not — so the error
-- propagated and ABORTED the user's insert (post creation broken).
--
-- This migration:
--   1. Fixes the body type (jsonb, no ::text) so pushes actually send.
--   2. Wraps the http_post call in its own exception handler so a push
--      failure can never break the triggering write again.
--   3. Adds the missing EXCEPTION handlers to the like and community-post
--      triggers, matching the already-fixed comment/DM triggers.

-- ─── 1+2. fire_push_notification: correct body type, never throw ─────────────

CREATE OR REPLACE FUNCTION internal.fire_push_notification(
  p_recipient_id  uuid,
  p_title         text,
  p_message       text,
  p_type          text,
  p_data          jsonb DEFAULT '{}'
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_url text;
  v_key text;
BEGIN
  -- Read secrets from Supabase Vault (encrypted at rest)
  BEGIN
    SELECT decrypted_secret INTO v_url
    FROM vault.decrypted_secrets
    WHERE name = 'app_supabase_url'
    LIMIT 1;

    SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets
    WHERE name = 'app_service_role_key'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    -- Vault not configured yet — skip silently
    RETURN;
  END;

  IF v_url IS NULL OR v_url = '' OR v_key IS NULL OR v_key = '' THEN
    RETURN;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url     := v_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
                   'Content-Type',  'application/json',
                   'Authorization', 'Bearer ' || v_key
                 ),
      body    := jsonb_build_object(
                   'userId',   p_recipient_id,
                   'title',    p_title,
                   'message',  p_message,
                   'type',     p_type,
                   'priority', 'normal',
                   'data',     p_data
                 )
    );
  EXCEPTION WHEN OTHERS THEN
    -- A failed push must never abort the write that triggered it
    RAISE WARNING 'fire_push_notification failed: %', SQLERRM;
  END;
END;
$$;

-- ─── 3a. notify_on_post_like: add missing exception handler ──────────────────

CREATE OR REPLACE FUNCTION internal.notify_on_post_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_post_author_id uuid;
  v_liker_name     text;
BEGIN
  SELECT user_id INTO v_post_author_id
  FROM public.community_posts
  WHERE id = NEW.post_id;

  -- Don't notify when someone likes their own post
  IF v_post_author_id IS NULL OR v_post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO v_liker_name
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  PERFORM internal.fire_push_notification(
    v_post_author_id,
    'New Like',
    COALESCE(v_liker_name, 'Someone') || ' liked your post',
    'like',
    jsonb_build_object(
      'post_id',  NEW.post_id,
      'liker_id', NEW.user_id,
      'type',     'post_like'
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_on_post_like failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- ─── 3b. notify_on_community_post: add missing exception handler ─────────────

CREATE OR REPLACE FUNCTION internal.notify_on_community_post()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_author_name     text;
  v_neighborhood    text;
  v_city            text;
  v_preview         text;
  v_rec             record;
BEGIN
  SELECT full_name, neighborhood, city
    INTO v_author_name, v_neighborhood, v_city
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  v_preview := left(COALESCE(NEW.title, NEW.content, ''), 80);

  FOR v_rec IN
    SELECT p.user_id
    FROM public.profiles p
    WHERE p.user_id     != NEW.user_id
      AND p.neighborhood = v_neighborhood
      AND p.city         = v_city
      AND p.neighborhood IS NOT NULL
    LIMIT 100
  LOOP
    PERFORM internal.fire_push_notification(
      v_rec.user_id,
      COALESCE(v_author_name, 'Your Neighbor'),
      'Posted: ' || v_preview,
      'community_post',
      jsonb_build_object(
        'post_id',   NEW.id,
        'author_id', NEW.user_id,
        'type',      'new_community_post'
      )
    );
  END LOOP;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_on_community_post failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- ─── 4. notify_emergency_via_email: same ::text bug, silently swallowed ──────
-- Its exception handler hid the 42883 error, so emergency alert EMAILS have
-- never been sent. Same fix: body must be jsonb.

CREATE OR REPLACE FUNCTION notify_emergency_via_email()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient_email TEXT;
  v_sender_name TEXT;
  v_panic_data RECORD;
  v_preferences RECORD;
  v_supabase_url TEXT;
  v_service_key TEXT;
  v_template_data JSONB;
  v_app_url TEXT := 'https://neighborlink.ng'; -- Default fallback
BEGIN
  -- Only proceed for emergency/panic alerts
  IF NEW.notification_type NOT IN ('emergency_alert', 'panic_alert') THEN
    RETURN NEW;
  END IF;

  -- Get Supabase URL and Service Key from app_configuration
  SELECT config_value #>> '{}' INTO v_supabase_url FROM app_configuration WHERE config_key = 'supabase_url';
  SELECT config_value #>> '{}' INTO v_service_key FROM app_configuration WHERE config_key = 'service_role_key';

  -- Try to get custom app URL if configured
  BEGIN
    SELECT config_value #>> '{}' INTO v_app_url FROM app_configuration WHERE config_key = 'app_url';
    IF v_app_url IS NULL THEN v_app_url := 'https://neighborlink.ng'; END IF;
  EXCEPTION WHEN OTHERS THEN
    v_app_url := 'https://neighborlink.ng';
  END;

  -- If config is missing, fail gracefully
  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get recipient email
  SELECT email INTO v_recipient_email FROM auth.users WHERE id = NEW.recipient_id;
  IF v_recipient_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check user preferences for emergency emails
  SELECT * INTO v_preferences FROM user_email_preferences WHERE user_id = NEW.recipient_id;

  -- If preferences exist and emergency_alerts is disabled, exit.
  -- Default behavior: ENABLED (if no preferences record exists yet)
  IF v_preferences IS NOT NULL AND v_preferences.emergency_alerts = false THEN
    RETURN NEW;
  END IF;

  -- Get comprehensive panic alert details
  SELECT pa.*, p.full_name as sender_name
  INTO v_panic_data
  FROM panic_alerts pa
  LEFT JOIN profiles p ON p.user_id = pa.user_id
  WHERE pa.id = NEW.panic_alert_id;

  -- Fallback for sender name
  v_sender_name := COALESCE(v_panic_data.sender_name, 'Someone');

  -- Prepare email payload matching the template structure
  v_template_data := jsonb_build_object(
    'alertType', v_panic_data.situation_type,
    'location', v_panic_data.address,
    'description', v_panic_data.message,
    'timestamp', v_panic_data.created_at,
    'senderName', v_sender_name,
    'appUrl', v_app_url,
    'authorName', v_sender_name
  );

  -- Call the Edge Function (body MUST be jsonb for net.http_post)
  PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/send-email-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key,
      'x-supabase-url', v_supabase_url,
      'x-supabase-key', v_service_key
    ),
    body := jsonb_build_object(
      'to', v_recipient_email,
      'subject', '🚨 EMERGENCY ALERT: ' || v_sender_name || ' needs help!',
      'type', 'emergency_alert',
      'data', v_template_data,
      'body', 'Emergency alert triggered by ' || v_sender_name
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_emergency_via_email failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
