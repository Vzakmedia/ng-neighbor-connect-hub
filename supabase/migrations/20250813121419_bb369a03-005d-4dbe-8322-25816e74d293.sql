-- Restrict public read access on activity tables while preserving legitimate viewing for authenticated users
-- 1) post_likes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'post_likes' AND policyname = 'Users can view all post likes'
  ) THEN
    DROP POLICY "Users can view all post likes" ON public.post_likes;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'post_likes' AND policyname = 'Authenticated users can view post likes'
  ) THEN
    CREATE POLICY "Authenticated users can view post likes"
    ON public.post_likes
    FOR SELECT
    USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 2) service_likes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'service_likes' AND policyname = 'Users can view all service likes'
  ) THEN
    DROP POLICY "Users can view all service likes" ON public.service_likes;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'service_likes' AND policyname = 'Authenticated users can view service likes'
  ) THEN
    CREATE POLICY "Authenticated users can view service likes"
    ON public.service_likes
    FOR SELECT
    USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 3) marketplace_item_likes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'marketplace_item_likes' AND policyname = 'Users can view all marketplace item likes'
  ) THEN
    DROP POLICY "Users can view all marketplace item likes" ON public.marketplace_item_likes;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'marketplace_item_likes' AND policyname = 'Authenticated users can view marketplace item likes'
  ) THEN
    CREATE POLICY "Authenticated users can view marketplace item likes"
    ON public.marketplace_item_likes
    FOR SELECT
    USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 4) post_comments
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'post_comments' AND policyname = 'Users can view all post comments'
  ) THEN
    DROP POLICY "Users can view all post comments" ON public.post_comments;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'post_comments' AND policyname = 'Authenticated users can view post comments'
  ) THEN
    CREATE POLICY "Authenticated users can view post comments"
    ON public.post_comments
    FOR SELECT
    USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 5) community_posts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'community_posts' AND policyname = 'Community posts are viewable by everyone'
  ) THEN
    DROP POLICY "Community posts are viewable by everyone" ON public.community_posts;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'community_posts' AND policyname = 'Authenticated users can view community posts'
  ) THEN
    CREATE POLICY "Authenticated users can view community posts"
    ON public.community_posts
    FOR SELECT
    USING (auth.uid() IS NOT NULL);
  END IF;
END $$;