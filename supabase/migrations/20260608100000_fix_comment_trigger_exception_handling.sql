-- Fix: AFTER INSERT triggers on post_comments were missing EXCEPTION handlers.
--
-- notify_post_comment_via_email() and notify_comment_reply_via_email() call
-- net.http_post(), which raises an ERROR if:
--   • the pg_net extension is not enabled, OR
--   • app.settings.service_role_key / app.settings.supabase_url are not set.
--
-- Without a top-level EXCEPTION block, that error propagates up and rolls back
-- the INSERT, showing "Failed to post comment" in the UI even though the user
-- did nothing wrong.
--
-- Fix: add EXCEPTION WHEN OTHERS THEN RETURN NEW to both functions, matching
-- the pattern already used in notify_emergency_via_email().

CREATE OR REPLACE FUNCTION notify_post_comment_via_email()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_post_author_id UUID;
  v_commenter_name TEXT;
  v_post_content TEXT;
  v_post_author_email TEXT;
  v_email_enabled BOOLEAN;
  v_post_comments_enabled BOOLEAN;
BEGIN
  SELECT user_id, content INTO v_post_author_id, v_post_content
  FROM community_posts
  WHERE id = NEW.post_id;

  IF v_post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO v_commenter_name
  FROM profiles
  WHERE user_id = NEW.user_id;

  SELECT
    uep.email_enabled,
    uep.post_comments,
    au.email
  INTO
    v_email_enabled,
    v_post_comments_enabled,
    v_post_author_email
  FROM user_email_preferences uep
  JOIN auth.users au ON au.id = uep.user_id
  WHERE uep.user_id = v_post_author_id;

  IF v_email_enabled = TRUE
     AND v_post_comments_enabled = TRUE
     AND v_post_author_email IS NOT NULL THEN

    PERFORM net.http_post(
      url     := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-email-notification',
      headers := jsonb_build_object(
                   'Content-Type', 'application/json',
                   'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
                 ),
      body    := jsonb_build_object(
                   'to', v_post_author_email,
                   'subject', v_commenter_name || ' commented on your post',
                   'type', 'post_comment',
                   'userId', v_post_author_id,
                   'data', jsonb_build_object(
                     'commentAuthor', v_commenter_name,
                     'commentContent', NEW.content,
                     'postContent', v_post_content,
                     'postId', NEW.post_id
                   )
                 )
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never let a notification error roll back the comment insert.
  RETURN NEW;
END;
$$;


CREATE OR REPLACE FUNCTION notify_comment_reply_via_email()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_parent_comment_author_id UUID;
  v_replier_name TEXT;
  v_parent_comment_content TEXT;
  v_parent_author_email TEXT;
  v_email_enabled BOOLEAN;
  v_comment_replies_enabled BOOLEAN;
BEGIN
  IF NEW.parent_comment_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id, content INTO v_parent_comment_author_id, v_parent_comment_content
  FROM post_comments
  WHERE id = NEW.parent_comment_id;

  IF v_parent_comment_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO v_replier_name
  FROM profiles
  WHERE user_id = NEW.user_id;

  SELECT
    uep.email_enabled,
    uep.comment_replies,
    au.email
  INTO
    v_email_enabled,
    v_comment_replies_enabled,
    v_parent_author_email
  FROM user_email_preferences uep
  JOIN auth.users au ON au.id = uep.user_id
  WHERE uep.user_id = v_parent_comment_author_id;

  IF v_email_enabled = TRUE
     AND v_comment_replies_enabled = TRUE
     AND v_parent_author_email IS NOT NULL THEN

    PERFORM net.http_post(
      url     := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-email-notification',
      headers := jsonb_build_object(
                   'Content-Type', 'application/json',
                   'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
                 ),
      body    := jsonb_build_object(
                   'to', v_parent_author_email,
                   'subject', v_replier_name || ' replied to your comment',
                   'type', 'comment_reply',
                   'userId', v_parent_comment_author_id,
                   'data', jsonb_build_object(
                     'commentAuthor', v_replier_name,
                     'replyContent', NEW.content,
                     'parentCommentContent', v_parent_comment_content,
                     'postId', NEW.post_id
                   )
                 )
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never let a notification error roll back the comment insert.
  RETURN NEW;
END;
$$;
