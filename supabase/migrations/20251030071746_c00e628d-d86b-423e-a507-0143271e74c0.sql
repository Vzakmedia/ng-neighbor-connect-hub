-- Create function to send email when someone replies to a comment
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
  -- Only process if this is a reply (has parent_comment_id)
  IF NEW.parent_comment_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get parent comment author ID and content
  SELECT user_id, content INTO v_parent_comment_author_id, v_parent_comment_content
  FROM post_comments
  WHERE id = NEW.parent_comment_id;
  
  -- Don't notify if replier is the parent comment author
  IF v_parent_comment_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get replier's name
  SELECT full_name INTO v_replier_name
  FROM profiles
  WHERE user_id = NEW.user_id;
  
  -- Get parent comment author's email preferences
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
  
  -- Check if parent comment author has email notifications enabled for replies
  IF v_email_enabled = TRUE 
     AND v_comment_replies_enabled = TRUE 
     AND v_parent_author_email IS NOT NULL THEN
    
    -- Call edge function to send email (async)
    PERFORM
      net.http_post(
        url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-email-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
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
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_comment_reply_email_notification ON post_comments;
CREATE TRIGGER on_comment_reply_email_notification
  AFTER INSERT ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_reply_via_email();