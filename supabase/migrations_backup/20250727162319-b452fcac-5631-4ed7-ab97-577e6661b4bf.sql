-- Create table to track read status for community posts
CREATE TABLE public.post_read_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE public.post_read_status ENABLE ROW LEVEL SECURITY;

-- Create policies for post read status
CREATE POLICY "Users can manage their own read status" 
ON public.post_read_status 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create table to track read status for board posts
CREATE TABLE public.board_post_read_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE public.board_post_read_status ENABLE ROW LEVEL SECURITY;

-- Create policies for board post read status
CREATE POLICY "Users can manage their own board post read status" 
ON public.board_post_read_status 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to mark community post as read
CREATE OR REPLACE FUNCTION public.mark_community_post_as_read(target_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.post_read_status (user_id, post_id)
  VALUES (auth.uid(), target_post_id)
  ON CONFLICT (user_id, post_id) 
  DO UPDATE SET read_at = now();
END;
$$;

-- Function to mark board post as read
CREATE OR REPLACE FUNCTION public.mark_board_post_as_read(target_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.board_post_read_status (user_id, post_id)
  VALUES (auth.uid(), target_post_id)
  ON CONFLICT (user_id, post_id) 
  DO UPDATE SET read_at = now();
END;
$$;

-- Function to mark all community posts as read for current user
CREATE OR REPLACE FUNCTION public.mark_all_community_posts_as_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.post_read_status (user_id, post_id)
  SELECT auth.uid(), cp.id
  FROM public.community_posts cp
  WHERE NOT EXISTS (
    SELECT 1 FROM public.post_read_status prs 
    WHERE prs.user_id = auth.uid() AND prs.post_id = cp.id
  );
END;
$$;

-- Function to get unread community posts count
CREATE OR REPLACE FUNCTION public.get_unread_community_posts_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  unread_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO unread_count
  FROM public.community_posts cp
  WHERE NOT EXISTS (
    SELECT 1 FROM public.post_read_status prs 
    WHERE prs.user_id = auth.uid() AND prs.post_id = cp.id
  );
  
  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.alert_notifications
  SET is_read = true, read_at = now()
  WHERE recipient_id = auth.uid() AND is_read = false;
END;
$$;

-- Function to get unread notifications count
CREATE OR REPLACE FUNCTION public.get_unread_notifications_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  unread_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO unread_count
  FROM public.alert_notifications
  WHERE recipient_id = auth.uid() AND is_read = false;
  
  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Function to get unread messages count
CREATE OR REPLACE FUNCTION public.get_unread_messages_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  unread_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO unread_count
  FROM public.direct_conversations dc
  WHERE (
    (dc.user1_id = auth.uid() AND dc.user1_has_unread = true) OR
    (dc.user2_id = auth.uid() AND dc.user2_has_unread = true)
  );
  
  RETURN COALESCE(unread_count, 0);
END;
$$;