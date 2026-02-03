-- Fix migration for existing structures: ensure columns exist, then seed

-- Ensure notification_templates columns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='notification_templates'
  ) THEN
    CREATE TABLE public.notification_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      template_key TEXT,
      channel TEXT,
      subject TEXT,
      body_html TEXT,
      body_text TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

ALTER TABLE public.notification_templates
  ADD COLUMN IF NOT EXISTS template_key TEXT,
  ADD COLUMN IF NOT EXISTS channel TEXT,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS body_html TEXT,
  ADD COLUMN IF NOT EXISTS body_text TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Constrain channel values
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notification_templates_channel_check'
  ) THEN
    ALTER TABLE public.notification_templates
    ADD CONSTRAINT notification_templates_channel_check CHECK (channel IN ('email','sms','push'));
  END IF;
END $$;

-- Unique constraint on (template_key, channel)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_notification_templates'
  ) THEN
    ALTER TABLE public.notification_templates
    ADD CONSTRAINT uq_notification_templates UNIQUE (template_key, channel);
  END IF;
END $$;

-- RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notification_templates' AND policyname='Active templates are viewable'
  ) THEN
    CREATE POLICY "Active templates are viewable" ON public.notification_templates FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notification_templates' AND policyname='Admins can manage templates'
  ) THEN
    CREATE POLICY "Admins can manage templates" ON public.notification_templates FOR ALL
    USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
    WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
  END IF;
END $$;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_notification_templates_updated_at ON public.notification_templates;
CREATE TRIGGER trg_notification_templates_updated_at
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure notification_preferences exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='notification_preferences'
  ) THEN
    CREATE TABLE public.notification_preferences (
      user_id UUID PRIMARY KEY,
      email_enabled BOOLEAN DEFAULT true,
      sms_enabled BOOLEAN DEFAULT false,
      push_enabled BOOLEAN DEFAULT true,
      preferred_channels TEXT[] DEFAULT ARRAY['push','email'],
      quiet_start TIME NULL,
      quiet_end TIME NULL,
      timezone TEXT NULL,
      min_severity TEXT DEFAULT 'low',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS preferred_channels TEXT[] DEFAULT ARRAY['push','email'],
  ADD COLUMN IF NOT EXISTS quiet_start TIME NULL,
  ADD COLUMN IF NOT EXISTS quiet_end TIME NULL,
  ADD COLUMN IF NOT EXISTS timezone TEXT NULL,
  ADD COLUMN IF NOT EXISTS min_severity TEXT DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Set PK if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notification_preferences_pkey'
  ) THEN
    ALTER TABLE public.notification_preferences ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (user_id);
  END IF;
END $$;

-- RLS for preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notification_preferences' AND policyname='Users manage their preferences'
  ) THEN
    CREATE POLICY "Users manage their preferences" ON public.notification_preferences FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_notification_prefs_updated_at ON public.notification_preferences;
CREATE TRIGGER trg_notification_prefs_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default templates
INSERT INTO public.notification_templates (template_key, channel, subject, body_html, body_text, is_active)
VALUES
  ('safety_alert', 'email', 'Safety Alert: {{title}}',
   '<h2>{{title}}</h2><p><strong>Severity:</strong> {{severity}}</p><p>{{description}}</p><p><strong>Location:</strong> {{address}}</p><p style="color:#888">Sent at {{timestamp}}</p>',
   NULL, true),
  ('safety_alert', 'sms', NULL, NULL,
   '[{{severity}}] {{title}} - {{description}} @ {{address}}', true),
  ('safety_alert', 'push', NULL,
   '<strong>{{title}}</strong> — {{description}}',
   '{{title}} — {{description}}', true)
ON CONFLICT (template_key, channel) DO NOTHING;
