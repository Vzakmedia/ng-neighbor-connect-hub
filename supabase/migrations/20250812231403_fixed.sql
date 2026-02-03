-- Phase 1: Privacy Data Protection
-- 1) Tighten access to messaging_preferences (self-only)
ALTER TABLE public.messaging_preferences ENABLE ROW LEVEL SECURITY;

-- Remove any overly permissive existing policies (if present)
DROP POLICY IF EXISTS "Anyone can view messaging preferences" ON public.messaging_preferences;
DROP POLICY IF EXISTS "Users can view messaging preferences" ON public.messaging_preferences;
DROP POLICY IF EXISTS "Users can manage messaging preferences" ON public.messaging_preferences;
DROP POLICY IF EXISTS "Public can view messaging preferences" ON public.messaging_preferences;

-- Create precise self-scoped policies
CREATE POLICY "Users can view their own messaging preferences"
ON public.messaging_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messaging preferences"
ON public.messaging_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messaging preferences"
ON public.messaging_preferences
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messaging preferences"
ON public.messaging_preferences
FOR DELETE
USING (auth.uid() = user_id);


-- 2) Reduce exposure of raw like records; keep inserts/deletes as-is, restrict broad read access
-- Comment likes: replace public SELECT with self-only
DROP POLICY IF EXISTS "Users can view all comment likes" ON public.comment_likes;
CREATE POLICY "Users can view their own comment likes"
ON public.comment_likes
FOR SELECT
USING (auth.uid() = user_id);

-- Chat message likes: replace public SELECT with self-only
DROP POLICY IF EXISTS "Users can view all chat message likes" ON public.chat_message_likes;
CREATE POLICY "Users can view their own chat message likes"
ON public.chat_message_likes
FOR SELECT
USING (auth.uid() = user_id);

-- Provide a safe aggregation RPC for comment likes (counts + whether current user liked)
CREATE OR REPLACE FUNCTION public.get_comment_likes(_comment_ids uuid[])
RETURNS TABLE(comment_id uuid, likes_count integer, liked_by_user boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  WITH input AS (
    SELECT unnest(_comment_ids) AS cid
  ),
  counts AS (
    SELECT comment_id, COUNT(*)::int AS likes_count
    FROM public.comment_likes
    WHERE comment_id = ANY(_comment_ids)
    GROUP BY comment_id
  ),
  likes AS (
    SELECT comment_id
    FROM public.comment_likes
    WHERE user_id = auth.uid() AND comment_id = ANY(_comment_ids)
  )
  SELECT 
    i.cid AS comment_id,
    COALESCE(c.likes_count, 0) AS likes_count,
    (l.comment_id IS NOT NULL) AS liked_by_user
  FROM input i
  LEFT JOIN counts c ON c.comment_id = i.cid
  LEFT JOIN likes l ON l.comment_id = i.cid;
$$;

-- Lock down function execution to authenticated users only
REVOKE ALL ON FUNCTION public.get_comment_likes(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_comment_likes(uuid[]) TO authenticated;