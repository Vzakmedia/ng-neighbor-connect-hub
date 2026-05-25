-- Push notification triggers for likes, comments, DMs, and new community posts.
--
-- Uses Supabase Vault for secrets (no ALTER DATABASE needed — works with
-- standard Supabase roles out of the box).
--
-- REQUIRED ONE-TIME SETUP — run these two lines in your Supabase SQL Editor:
--
--   SELECT vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'app_supabase_url');
--   SELECT vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'app_service_role_key');
--
-- (Replace the placeholders with your actual values from
--  Supabase Dashboard → Settings → API)
--
-- Until those secrets are set the triggers no-op silently — no errors.

-- ─── Ensure internal schema exists ────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS internal;

-- ─── Shared helper: call send-push-notification via pg_net ────────────────────

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
  -- Read secrets from Supabase Vault (encrypted at rest, no ALTER DATABASE needed)
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
               )::text
  );
END;
$$;

-- ─── 1. Post likes ────────────────────────────────────────────────────────────

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
END;
$$;

DROP TRIGGER IF EXISTS push_on_post_like ON public.post_likes;
CREATE TRIGGER push_on_post_like
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION internal.notify_on_post_like();

-- ─── 2. Post comments ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION internal.notify_on_post_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_post_author_id uuid;
  v_commenter_name text;
  v_preview        text;
BEGIN
  SELECT user_id INTO v_post_author_id
  FROM public.community_posts
  WHERE id = NEW.post_id;

  IF v_post_author_id IS NULL OR v_post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO v_commenter_name
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  v_preview := left(COALESCE(NEW.content, ''), 80);

  PERFORM internal.fire_push_notification(
    v_post_author_id,
    'New Comment',
    COALESCE(v_commenter_name, 'Someone') || ' commented: ' || v_preview,
    'comment',
    jsonb_build_object(
      'post_id',      NEW.post_id,
      'comment_id',   NEW.id,
      'commenter_id', NEW.user_id,
      'type',         'post_comment'
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS push_on_post_comment ON public.post_comments;
CREATE TRIGGER push_on_post_comment
  AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION internal.notify_on_post_comment();

-- ─── 3. Direct messages ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION internal.notify_on_direct_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sender_name text;
  v_preview     text;
BEGIN
  IF NEW.recipient_id IS NULL OR NEW.recipient_id = NEW.sender_id THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO v_sender_name
  FROM public.profiles
  WHERE user_id = NEW.sender_id;

  v_preview := left(COALESCE(NEW.content, ''), 80);

  PERFORM internal.fire_push_notification(
    NEW.recipient_id,
    COALESCE(v_sender_name, 'New Message'),
    v_preview,
    'message',
    jsonb_build_object(
      'sender_id',       NEW.sender_id,
      'message_id',      NEW.id,
      'conversation_id', NEW.conversation_id,
      'type',            'direct_message'
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS push_on_direct_message ON public.direct_messages;
CREATE TRIGGER push_on_direct_message
  AFTER INSERT ON public.direct_messages
  FOR EACH ROW EXECUTE FUNCTION internal.notify_on_direct_message();

-- ─── 4. New community posts (neighborhood-scoped) ─────────────────────────────
-- Notifies neighbors (same neighborhood + city) — capped at 100 per post.

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
END;
$$;

DROP TRIGGER IF EXISTS push_on_community_post ON public.community_posts;
CREATE TRIGGER push_on_community_post
  AFTER INSERT ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION internal.notify_on_community_post();
