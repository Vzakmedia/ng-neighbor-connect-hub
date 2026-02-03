-- Notification Phase 2: Templates and User Preferences

-- Helper: update_updated_at_column (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1) Notification Templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','sms','push')),
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_notification_templates UNIQUE (template_key, channel)
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Active templates are viewable by everyone
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_templates' AND policyname = 'Active templates are viewable'
  ) THEN
    CREATE POLICY "Active templates are viewable"
    ON public.notification_templates
    FOR SELECT
    USING (is_active = true);
  END IF;
END $$;

-- Admins can manage templates
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_templates' AND policyname = 'Admins can manage templates'
  ) THEN
    CREATE POLICY "Admins can manage templates"
    ON public.notification_templates
    FOR ALL
    USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
    WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
  END IF;
END $$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_notification_templates_updated_at ON public.notification_templates;
CREATE TRIGGER trg_notification_templates_updated_at
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) User Notification Preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  preferred_channels TEXT[] NOT NULL DEFAULT ARRAY['push','email'],
  quiet_start TIME NULL,
  quiet_end TIME NULL,
  timezone TEXT NULL,
  min_severity TEXT NOT NULL DEFAULT 'low',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users manage their own preferences
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_preferences' AND policyname = 'Users manage their preferences'
  ) THEN
    CREATE POLICY "Users manage their preferences"
    ON public.notification_preferences
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger for updated_at on preferences
DROP TRIGGER IF EXISTS trg_notification_prefs_updated_at ON public.notification_preferences;
CREATE TRIGGER trg_notification_prefs_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Seed default templates (idempotent)
INSERT INTO public.notification_templates (template_key, channel, subject, body_html, body_text)
VALUES
  ('safety_alert', 'email', 'Safety Alert: {{title}}',
   '<h2>{{title}}</h2><p><strong>Severity:</strong> {{severity}}</p><p>{{description}}</p><p><strong>Location:</strong> {{address}}</p><p style="color:#888">Sent at {{timestamp}}</p>',
   NULL),
  ('safety_alert', 'sms', NULL, NULL,
   '[{{severity}}] {{title}} - {{description}} @ {{address}}'),
  ('safety_alert', 'push', NULL,
   '<strong>{{title}}</strong> — {{description}}',
   '{{title}} — {{description}}')
ON CONFLICT (template_key, channel) DO NOTHING;
