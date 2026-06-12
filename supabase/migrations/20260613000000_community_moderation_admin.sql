-- Community moderation admin coverage: events, polls, discussion boards,
-- recommendations. These high-engagement features had ZERO admin tooling;
-- the new /admin/community page and Moderator dashboard tabs need RLS
-- policies so moderation writes don't silently affect 0 rows (the recurring
-- failure mode in this codebase).
--
-- Moderation predicate: admin OR super_admin OR moderator.

-- ─── Columns for soft moderation states ──────────────────────────────────────

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

ALTER TABLE public.discussion_boards
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- ─── Moderation policies ─────────────────────────────────────────────────────

DO $$
BEGIN
  -- events: admins must see private events, cancel (UPDATE) and remove (DELETE)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='events' AND policyname='Moderators can view all events') THEN
    CREATE POLICY "Moderators can view all events"
      ON public.events FOR SELECT
      USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='events' AND policyname='Moderators can update events') THEN
    CREATE POLICY "Moderators can update events"
      ON public.events FOR UPDATE
      USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='events' AND policyname='Moderators can delete events') THEN
    CREATE POLICY "Moderators can delete events"
      ON public.events FOR DELETE
      USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
  END IF;

  -- event_rsvps: no FK cascade from events — RSVPs are deleted explicitly
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='event_rsvps' AND policyname='Moderators can view all rsvps') THEN
    CREATE POLICY "Moderators can view all rsvps"
      ON public.event_rsvps FOR SELECT
      USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='event_rsvps' AND policyname='Moderators can delete rsvps') THEN
    CREATE POLICY "Moderators can delete rsvps"
      ON public.event_rsvps FOR DELETE
      USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
  END IF;

  -- polls: close (UPDATE closes_at) and delete (options/votes cascade)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='polls' AND policyname='Moderators can update polls') THEN
    CREATE POLICY "Moderators can update polls"
      ON public.polls FOR UPDATE
      USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='polls' AND policyname='Moderators can delete polls') THEN
    CREATE POLICY "Moderators can delete polls"
      ON public.polls FOR DELETE
      USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
  END IF;

  -- discussion_boards: see private boards, archive (UPDATE), delete (cascades)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='discussion_boards' AND policyname='Moderators can view all boards') THEN
    CREATE POLICY "Moderators can view all boards"
      ON public.discussion_boards FOR SELECT
      USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='discussion_boards' AND policyname='Moderators can update boards') THEN
    CREATE POLICY "Moderators can update boards"
      ON public.discussion_boards FOR UPDATE
      USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='discussion_boards' AND policyname='Moderators can delete boards') THEN
    CREATE POLICY "Moderators can delete boards"
      ON public.discussion_boards FOR DELETE
      USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
  END IF;

  -- board_posts: view posts in any board, remove offending posts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='board_posts' AND policyname='Moderators can view all board posts') THEN
    CREATE POLICY "Moderators can view all board posts"
      ON public.board_posts FOR SELECT
      USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='board_posts' AND policyname='Moderators can delete board posts') THEN
    CREATE POLICY "Moderators can delete board posts"
      ON public.board_posts FOR DELETE
      USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
  END IF;

  -- board_members: member counts for the boards table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='board_members' AND policyname='Moderators can view all board members') THEN
    CREATE POLICY "Moderators can view all board members"
      ON public.board_members FOR SELECT
      USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
  END IF;

  -- recommendations: spam moderation
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='recommendations' AND policyname='Moderators can view all recommendations') THEN
    CREATE POLICY "Moderators can view all recommendations"
      ON public.recommendations FOR SELECT
      USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='recommendations' AND policyname='Moderators can update recommendations') THEN
    CREATE POLICY "Moderators can update recommendations"
      ON public.recommendations FOR UPDATE
      USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='recommendations' AND policyname='Moderators can delete recommendations') THEN
    CREATE POLICY "Moderators can delete recommendations"
      ON public.recommendations FOR DELETE
      USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
  END IF;

  -- recommendation_reviews: review moderation (deleted before parent rec)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='recommendation_reviews' AND policyname='Moderators can view all reviews') THEN
    CREATE POLICY "Moderators can view all reviews"
      ON public.recommendation_reviews FOR SELECT
      USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='recommendation_reviews' AND policyname='Moderators can delete reviews') THEN
    CREATE POLICY "Moderators can delete reviews"
      ON public.recommendation_reviews FOR DELETE
      USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
