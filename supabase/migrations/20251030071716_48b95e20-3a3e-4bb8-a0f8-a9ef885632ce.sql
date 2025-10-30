-- Create function to send email when someone comments on a post
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
  -- Get post author ID and content
  SELECT user_id, content INTO v_post_author_id, v_post_content
  FROM community_posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if commenter is the post author
  IF v_post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter's name
  SELECT full_name INTO v_commenter_name
  FROM profiles
  WHERE user_id = NEW.user_id;
  
  -- Get post author's email preferences and email
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
  
  -- Check if post author has email notifications enabled for comments
  IF v_email_enabled = TRUE 
     AND v_post_comments_enabled = TRUE 
     AND v_post_author_email IS NOT NULL THEN
    
    -- Call edge function to send email (async - non-blocking)
    PERFORM
      net.http_post(
        url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-email-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
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
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_post_comment_email_notification ON post_comments;
CREATE TRIGGER on_post_comment_email_notification
  AFTER INSERT ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_comment_via_email();