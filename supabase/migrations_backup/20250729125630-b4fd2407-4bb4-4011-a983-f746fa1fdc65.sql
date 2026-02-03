-- Create platform automations table
CREATE TABLE IF NOT EXISTS public.platform_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  automation_type TEXT NOT NULL CHECK (automation_type IN ('content_moderation', 'user_management', 'emergency_response', 'marketplace', 'notifications', 'analytics')),
  trigger_event TEXT NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create app configuration table
CREATE TABLE IF NOT EXISTS public.app_configuration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  config_type TEXT NOT NULL CHECK (config_type IN ('theme', 'feature_toggle', 'emergency_settings', 'moderation_rules', 'app_settings')),
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create automation execution log
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID NOT NULL REFERENCES public.platform_automations(id) ON DELETE CASCADE,
  execution_status TEXT NOT NULL CHECK (execution_status IN ('success', 'failed', 'partial')),
  execution_details JSONB DEFAULT '{}',
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processing_time_ms INTEGER
);

-- Enable RLS
ALTER TABLE public.platform_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- Platform automations policies
CREATE POLICY "Admins can manage automations" 
ON public.platform_automations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- App configuration policies
CREATE POLICY "Admins can manage app configuration" 
ON public.app_configuration 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view public configuration" 
ON public.app_configuration 
FOR SELECT 
USING (is_public = true);

-- Automation logs policies
CREATE POLICY "Admins can view automation logs" 
ON public.automation_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Insert default app configurations
INSERT INTO public.app_configuration (config_key, config_value, config_type, description, is_public, updated_by) VALUES
('app_theme', '{"primary_color": "#3b82f6", "dark_mode": true, "font_family": "Inter"}', 'theme', 'Main application theme settings', true, (SELECT id FROM auth.users LIMIT 1)),
('emergency_settings', '{"auto_alert_radius": 5, "response_time_limit": 300, "auto_resolve_false_alarms": true}', 'emergency_settings', 'Emergency alert system configuration', false, (SELECT id FROM auth.users LIMIT 1)),
('content_moderation', '{"auto_flag_keywords": ["spam", "scam"], "auto_approve_verified_users": true, "review_queue_limit": 50}', 'moderation_rules', 'Content moderation rules', false, (SELECT id FROM auth.users LIMIT 1)),
('marketplace_settings', '{"auto_renewal": false, "listing_duration_days": 30, "max_images": 5}', 'app_settings', 'Marketplace configuration', true, (SELECT id FROM auth.users LIMIT 1)),
('notification_settings', '{"push_enabled": true, "email_enabled": true, "emergency_broadcast": true}', 'app_settings', 'Platform notification settings', false, (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (config_key) DO NOTHING;

-- Insert default automations
INSERT INTO public.platform_automations (name, description, automation_type, trigger_event, trigger_conditions, actions, created_by) VALUES
('Auto-approve verified user posts', 'Automatically approve posts from verified users', 'content_moderation', 'post_created', '{"user_verified": true}', '[{"action": "approve_post", "delay": 0}]', (SELECT id FROM auth.users LIMIT 1)),
('Emergency alert notifications', 'Send notifications when emergency alerts are created', 'emergency_response', 'panic_alert_created', '{"severity": "high"}', '[{"action": "send_notification", "target": "emergency_contacts"}, {"action": "create_public_alert"}]', (SELECT id FROM auth.users LIMIT 1)),
('Marketplace auto-expire', 'Automatically expire old marketplace listings', 'marketplace', 'daily_cleanup', '{"days_old": 30}', '[{"action": "expire_listing", "notify_user": true}]', (SELECT id FROM auth.users LIMIT 1)),
('Content spam filter', 'Auto-flag potential spam content', 'content_moderation', 'content_created', '{"contains_spam_keywords": true}', '[{"action": "flag_content", "reason": "spam"}]', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT DO NOTHING;

-- Add triggers
CREATE TRIGGER update_platform_automations_updated_at
  BEFORE UPDATE ON public.platform_automations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_configuration_updated_at
  BEFORE UPDATE ON public.app_configuration
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();