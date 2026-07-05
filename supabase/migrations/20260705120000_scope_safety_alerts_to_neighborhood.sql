-- ─────────────────────────────────────────────────────────────────────────────
-- Scope safety alerts to the author's neighborhood — server-side enforcement.
--
-- Before this migration the SELECT policy was USING (true): every client
-- could read (and, via Realtime, receive) every safety alert nationwide.
-- Neighborhood scoping only existed as client-side filtering.
--
-- This migration:
--   1. Adds a denormalized `neighborhood` column to safety_alerts
--   2. Stamps it from the author's profile via a BEFORE INSERT trigger
--      (server-side — clients cannot spoof or forget it)
--   3. Backfills existing rows
--   4. Indexes the scoped-query access path
--   5. Replaces the world-readable SELECT policy with neighborhood scoping.
--      Supabase Realtime (postgres_changes) enforces RLS per subscriber, so
--      this also stops the nationwide realtime broadcast at the database.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Column
ALTER TABLE public.safety_alerts
  ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- 2. Trigger: stamp the author's profile neighborhood at insert time
CREATE OR REPLACE FUNCTION public.set_safety_alert_neighborhood()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  SELECT p.neighborhood
    INTO NEW.neighborhood
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_safety_alert_neighborhood ON public.safety_alerts;
CREATE TRIGGER set_safety_alert_neighborhood
  BEFORE INSERT ON public.safety_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_safety_alert_neighborhood();

-- 3. Backfill existing alerts from their authors' profiles
UPDATE public.safety_alerts sa
SET neighborhood = p.neighborhood
FROM public.profiles p
WHERE p.user_id = sa.user_id
  AND sa.neighborhood IS NULL;

-- 4. Index for the scoped access path (banner/bell query shape)
CREATE INDEX IF NOT EXISTS idx_safety_alerts_neighborhood_status_created
  ON public.safety_alerts (neighborhood, status, created_at DESC);

-- 5. Viewer-neighborhood helper. SECURITY DEFINER so the policy can read
--    profiles without depending on (or recursing into) profiles RLS.
CREATE OR REPLACE FUNCTION public.current_user_neighborhood()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT neighborhood
  FROM public.profiles
  WHERE user_id = auth.uid();
$$;

-- 6. Replace the world-readable SELECT policy.
--    Visible to: the author, same-neighborhood users, and staff dashboards.
--    Alerts with no neighborhood (author had none set) are visible only to
--    the author and staff — never broadcast nationwide.
DROP POLICY IF EXISTS "Users can view safety alerts in their area" ON public.safety_alerts;

CREATE POLICY "Safety alerts visible to own neighborhood"
  ON public.safety_alerts
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      neighborhood IS NOT NULL
      AND neighborhood = public.current_user_neighborhood()
    )
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'support')
  );
