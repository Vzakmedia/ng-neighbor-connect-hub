-- Email logs table for audit trail
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  email_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  provider TEXT DEFAULT 'resend',
  provider_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User email preferences
CREATE TABLE IF NOT EXISTS public.user_email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Per-notification-type preferences
  safety_alerts BOOLEAN DEFAULT true,
  emergency_alerts BOOLEAN DEFAULT true,
  panic_alerts BOOLEAN DEFAULT true,
  community_posts BOOLEAN DEFAULT false,
  marketplace_updates BOOLEAN DEFAULT true,
  service_bookings BOOLEAN DEFAULT true,
  messages BOOLEAN DEFAULT true,
  contact_requests BOOLEAN DEFAULT true,
  event_reminders BOOLEAN DEFAULT true,
  
  -- Delivery frequency
  frequency TEXT DEFAULT 'immediate',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'UTC',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_email_preferences_user_id ON public.user_email_preferences(user_id);

-- RLS Policies
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_email_preferences ENABLE ROW LEVEL SECURITY;

-- Email logs: Users can only see their own
DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_logs;
CREATE POLICY "Users can view own email logs"
  ON public.email_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Email preferences: Users manage their own
DROP POLICY IF EXISTS "Users can view own email preferences" ON public.user_email_preferences;
CREATE POLICY "Users can view own email preferences"
  ON public.user_email_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own email preferences" ON public.user_email_preferences;
CREATE POLICY "Users can update own email preferences"
  ON public.user_email_preferences FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own email preferences" ON public.user_email_preferences;
CREATE POLICY "Users can insert own email preferences"
  ON public.user_email_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);