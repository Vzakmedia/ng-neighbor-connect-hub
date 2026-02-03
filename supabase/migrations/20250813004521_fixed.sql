-- Tighten RLS for alert_responses to prevent public visibility
-- 1) Drop overly permissive public read policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'alert_responses' AND policyname = 'Users can view alert responses'
  ) THEN
    DROP POLICY "Users can view alert responses" ON public.alert_responses;
  END IF;
END $$;

-- 2) Allow users to view only their own responses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'alert_responses' AND policyname = 'Users can view their own alert responses'
  ) THEN
    CREATE POLICY "Users can view their own alert responses"
    ON public.alert_responses
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3) Allow alert creators to view responses on their alerts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'alert_responses' AND policyname = 'Alert creators can view responses'
  ) THEN
    CREATE POLICY "Alert creators can view responses"
    ON public.alert_responses
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.safety_alerts sa
        WHERE sa.id = alert_responses.alert_id
          AND sa.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 4) Allow privileged staff to view all responses (admins, moderators, managers, support)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'alert_responses' AND policyname = 'Staff can view all alert responses'
  ) THEN
    CREATE POLICY "Staff can view all alert responses"
    ON public.alert_responses
    FOR SELECT
    USING (
      has_role(auth.uid(), 'super_admin'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'moderator'::app_role)
      OR has_role(auth.uid(), 'manager'::app_role)
      OR has_role(auth.uid(), 'support'::app_role)
    );
  END IF;
END $$;