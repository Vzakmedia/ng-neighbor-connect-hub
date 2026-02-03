-- Phase 1: Add new columns to user_email_preferences for comment and messaging notifications
ALTER TABLE public.user_email_preferences 
  ADD COLUMN IF NOT EXISTS post_comments BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS comment_replies BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS post_likes BOOLEAN DEFAULT false;

-- Add comments to explain columns
COMMENT ON COLUMN public.user_email_preferences.post_comments IS 'Receive emails when someone comments on your posts';
COMMENT ON COLUMN public.user_email_preferences.comment_replies IS 'Receive emails when someone replies to your comments';
COMMENT ON COLUMN public.user_email_preferences.post_likes IS 'Receive emails when someone likes your posts (warning: can be noisy)';

-- Enable pg_net extension for database triggers to call edge functions
CREATE EXTENSION IF NOT EXISTS pg_net;