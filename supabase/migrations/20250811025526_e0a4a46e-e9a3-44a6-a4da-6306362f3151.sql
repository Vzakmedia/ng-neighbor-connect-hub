-- Phase 3 DB changes: escalation + prefs + function hardening

-- Harden timestamp trigger function with fixed search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Extend notification_preferences with escalation settings
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS escalate_if_unread_minutes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS escalate_min_severity TEXT NOT NULL DEFAULT 'high';

-- Create notification_escalations table
CREATE TABLE IF NOT EXISTS public.notification_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL,
  user_id UUID NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | sent | skipped | failed
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Indexes for processing
CREATE INDEX IF NOT EXISTS idx_notification_escalations_due ON public.notification_escalations (due_at);
CREATE INDEX IF NOT EXISTS idx_notification_escalations_status ON public.notification_escalations (status);
CREATE INDEX IF NOT EXISTS idx_notification_escalations_user_alert ON public.notification_escalations (user_id, alert_id);

-- Enable RLS and policies
ALTER TABLE public.notification_escalations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notification_escalations' AND policyname='Admins can view escalations'
  ) THEN
    CREATE POLICY "Admins can view escalations" ON public.notification_escalations
    FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notification_escalations' AND policyname='System can manage escalations'
  ) THEN
    CREATE POLICY "System can manage escalations" ON public.notification_escalations
    FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;