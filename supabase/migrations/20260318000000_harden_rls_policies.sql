-- Migration: Harden overly permissive RLS policies
-- Created: 2026-03-18
-- Fixes USING(true) policies on internal/system tables that should not be accessible by regular users.

-- ─── 1. function_rate_limits: Add missing RLS policy ─────────────────────────
-- This table was missing any policy despite RLS being enabled.
-- Only the service role (Edge Functions) should read/write it.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='function_rate_limits' AND policyname='Service role manages rate limits'
  ) THEN
    CREATE POLICY "Service role manages rate limits"
      ON public.function_rate_limits
      FOR ALL
      USING (true) -- service_role bypasses RLS by default; this blocks anon+authenticated
      WITH CHECK (true);
  END IF;
END $$;
-- Revoke direct access from authenticated users (edge functions use service role, not user role)
REVOKE ALL ON public.function_rate_limits FROM authenticated, anon;

-- ─── 2. alert_cache: Restrict to service role only ────────────────────────────
-- alert_cache was FOR ALL USING (true) — any user could poison the cache.
DROP POLICY IF EXISTS "System can manage alert cache" ON public.alert_cache;
CREATE POLICY "Admin can view alert cache"
  ON public.alert_cache
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
-- Cache writes only from service role (Edge Functions)
REVOKE INSERT, UPDATE, DELETE ON public.alert_cache FROM authenticated, anon;

-- ─── 3. notification_escalations: Restrict to admins + service role ───────────
-- Previously FOR ALL USING (true) — any authenticated user could insert fake escalations.
DROP POLICY IF EXISTS "System can manage escalations" ON public.notification_escalations;
CREATE POLICY "Admins can manage escalations"
  ON public.notification_escalations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ─── 4. Audit other USING(true) SELECT policies ───────────────────────────────
-- These are intentionally public read policies for community content (acceptable):
--   • community_posts: SELECT USING (true) TO authenticated  → OK (public content in community)
--   • community_post_likes: SELECT USING (true) TO authenticated → OK
--   • community_post_comments: SELECT USING (true) TO authenticated → OK
--   • promoted_posts: SELECT USING (true) TO authenticated → OK
-- These use USING(true) but are scoped TO authenticated (not anon), which is acceptable.

-- ─── 5. Add WITH CHECK to known UPDATE policies without it ────────────────────
-- board_posts update for post owners (prevent user_id modification)
DROP POLICY IF EXISTS "Users can update their own board posts" ON public.board_posts;
CREATE POLICY "Users can update their own board posts"
  ON public.board_posts
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- community_posts update for post owners
DROP POLICY IF EXISTS "Users can update their own community posts" ON public.community_posts;
CREATE POLICY "Users can update their own community posts"
  ON public.community_posts
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
