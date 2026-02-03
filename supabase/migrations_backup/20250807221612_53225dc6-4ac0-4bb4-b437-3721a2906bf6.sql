-- Production-Grade Real-Time Notification System Schema

-- Create enhanced notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL, -- 'alert', 'message', 'system', 'marketing', 'transaction'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'delivered', 'failed', 'read'
  data JSONB DEFAULT '{}', -- Additional payload data
  channels TEXT[] DEFAULT ARRAY['in_app'], -- 'in_app', 'push', 'email', 'sms'
  scheduled_for TIMESTAMP WITH TIME ZONE, -- For delayed delivery
  expires_at TIMESTAMP WITH TIME ZONE, -- Auto-expiry
  source_id UUID, -- Reference to source entity (alert, message, etc.)
  source_type TEXT, -- Type of source entity
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create deliveries tracking table
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel TEXT NOT NULL, -- 'in_app', 'push', 'email', 'sms'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'expired'
  provider TEXT, -- 'fcm', 'apns', 'twilio', 'sendgrid', etc.
  provider_id TEXT, -- External provider message ID
  error_code TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  in_app_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  priority_filter TEXT DEFAULT 'low', -- Minimum priority to receive
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'UTC',
  email_digest BOOLEAN DEFAULT false,
  email_digest_frequency TEXT DEFAULT 'daily', -- 'immediate', 'hourly', 'daily', 'weekly'
  categories JSONB DEFAULT '{}', -- Per-category preferences
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user devices table for push notifications
CREATE TABLE IF NOT EXISTS public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'ios', 'android', 'web'
  app_version TEXT,
  os_version TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, device_token)
);

-- Create notification templates table
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  email_template TEXT,
  sms_template TEXT,
  push_template JSONB,
  default_channels TEXT[] DEFAULT ARRAY['in_app'],
  default_priority TEXT DEFAULT 'medium',
  variables JSONB DEFAULT '[]', -- Expected template variables
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notification metrics table for observability
CREATE TABLE IF NOT EXISTS public.notification_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hour INTEGER NOT NULL DEFAULT EXTRACT(hour from now()),
  channel TEXT NOT NULL,
  type TEXT NOT NULL,
  priority TEXT NOT NULL,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  total_read INTEGER DEFAULT 0,
  avg_delivery_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(date, hour, channel, type, priority)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON public.notifications(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON public.notifications(user_id, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON public.notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON public.notifications(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_source ON public.notifications(source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_deliveries_notification ON public.notification_deliveries(notification_id, channel);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.notification_deliveries(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deliveries_retry ON public.notification_deliveries(status, retry_count) WHERE status = 'failed';

CREATE INDEX IF NOT EXISTS idx_devices_user_active ON public.user_devices(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_devices_token ON public.user_devices(device_token);

CREATE INDEX IF NOT EXISTS idx_metrics_aggregation ON public.notification_metrics(date, hour, channel, type);

-- Enable RLS on all tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their notification read status" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for deliveries (admin/system access mainly)
CREATE POLICY "Admins can view all deliveries" ON public.notification_deliveries
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System can manage deliveries" ON public.notification_deliveries
  FOR ALL WITH CHECK (true);

-- RLS Policies for preferences
CREATE POLICY "Users can manage their notification preferences" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for devices
CREATE POLICY "Users can manage their devices" ON public.user_devices
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for templates (admin only)
CREATE POLICY "Admins can manage templates" ON public.notification_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view active templates" ON public.notification_templates
  FOR SELECT USING (is_active = true);

-- RLS Policies for metrics (admin only)
CREATE POLICY "Admins can view metrics" ON public.notification_metrics
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System can update metrics" ON public.notification_metrics
  FOR ALL WITH CHECK (true);