-- Create missing tables for safety center functionality

-- 1. Public emergency alerts table (referenced in edge function but missing)
CREATE TABLE IF NOT EXISTS public.public_emergency_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    panic_alert_id UUID REFERENCES public.panic_alerts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    situation_type TEXT NOT NULL,
    latitude DECIMAL NOT NULL,
    longitude DECIMAL NOT NULL,
    address TEXT,
    radius_km INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours')
);

-- 2. Emergency automation rules table
CREATE TABLE IF NOT EXISTS public.emergency_automation_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('escalation', 'notification', 'auto_resolve', 'location_check')),
    trigger_conditions JSONB NOT NULL DEFAULT '{}',
    actions JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 3,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Safety center settings table
CREATE TABLE IF NOT EXISTS public.safety_center_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    setting_type TEXT NOT NULL CHECK (setting_type IN ('global', 'user_default', 'system')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    updated_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Emergency escalation log table
CREATE TABLE IF NOT EXISTS public.emergency_escalation_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_id UUID NOT NULL,
    escalation_level INTEGER NOT NULL DEFAULT 1,
    escalation_type TEXT NOT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    triggered_by UUID,
    action_taken TEXT,
    metadata JSONB DEFAULT '{}',
    success BOOLEAN DEFAULT true
);

-- Enable RLS on all new tables
ALTER TABLE public.public_emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_center_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_escalation_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public_emergency_alerts
CREATE POLICY "Users can view public emergency alerts in their area" 
ON public.public_emergency_alerts 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "System can manage public emergency alerts" 
ON public.public_emergency_alerts 
FOR ALL 
USING (true)
WITH CHECK (true);

-- RLS Policies for emergency_automation_rules
CREATE POLICY "Admins can manage automation rules" 
ON public.emergency_automation_rules 
FOR ALL 
USING (has_staff_permission(auth.uid(), 'emergency_management', 'write'))
WITH CHECK (has_staff_permission(auth.uid(), 'emergency_management', 'write'));

CREATE POLICY "Staff can view automation rules" 
ON public.emergency_automation_rules 
FOR SELECT 
USING (has_staff_permission(auth.uid(), 'emergency_management', 'read'));

-- RLS Policies for safety_center_settings
CREATE POLICY "Admins can manage safety settings" 
ON public.safety_center_settings 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view public safety settings" 
ON public.safety_center_settings 
FOR SELECT 
USING (setting_type = 'user_default');

-- RLS Policies for emergency_escalation_log
CREATE POLICY "Staff can view escalation logs" 
ON public.emergency_escalation_log 
FOR SELECT 
USING (has_staff_permission(auth.uid(), 'emergency_management', 'read'));

CREATE POLICY "System can create escalation logs" 
ON public.emergency_escalation_log 
FOR INSERT 
WITH CHECK (true);

-- Insert default safety center settings
INSERT INTO public.safety_center_settings (setting_key, setting_value, setting_type, description, updated_by) VALUES
('default_alert_radius_km', '5', 'user_default', 'Default radius for emergency alerts in kilometers', auth.uid()),
('max_panic_alerts_per_hour', '3', 'global', 'Maximum panic alerts allowed per user per hour', auth.uid()),
('auto_escalation_enabled', 'true', 'global', 'Enable automatic escalation of unresolved critical alerts', auth.uid()),
('escalation_timeout_minutes', '30', 'global', 'Minutes before escalating unresolved critical alerts', auth.uid()),
('community_alert_enabled', 'true', 'user_default', 'Enable community-wide emergency alerts', auth.uid()),
('location_verification_required', 'false', 'global', 'Require location verification for emergency alerts', auth.uid()),
('emergency_services_integration', 'false', 'global', 'Enable integration with local emergency services', auth.uid())
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_public_emergency_alerts_location ON public.public_emergency_alerts(latitude, longitude) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_public_emergency_alerts_active ON public.public_emergency_alerts(is_active, created_at);
CREATE INDEX IF NOT EXISTS idx_emergency_automation_rules_active ON public.emergency_automation_rules(is_active, rule_type);
CREATE INDEX IF NOT EXISTS idx_emergency_escalation_log_alert ON public.emergency_escalation_log(alert_id, escalation_level);

-- Add missing columns to existing tables if they don't exist
DO $$ 
BEGIN 
    -- Add notification channels to emergency contacts if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_contacts' AND column_name = 'notification_enabled') THEN
        ALTER TABLE public.emergency_contacts ADD COLUMN notification_enabled BOOLEAN DEFAULT true;
    END IF;
    
    -- Add priority level to safety alerts if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'safety_alerts' AND column_name = 'priority_level') THEN
        ALTER TABLE public.safety_alerts ADD COLUMN priority_level INTEGER DEFAULT 3;
    END IF;
    
    -- Add escalation count to panic alerts if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'panic_alerts' AND column_name = 'escalation_count') THEN
        ALTER TABLE public.panic_alerts ADD COLUMN escalation_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add last escalated timestamp to panic alerts if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'panic_alerts' AND column_name = 'last_escalated_at') THEN
        ALTER TABLE public.panic_alerts ADD COLUMN last_escalated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;