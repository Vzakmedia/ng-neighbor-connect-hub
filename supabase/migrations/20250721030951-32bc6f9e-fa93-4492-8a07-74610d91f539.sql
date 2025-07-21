-- Create enum for safety alert types
CREATE TYPE safety_alert_type AS ENUM (
  'break_in',
  'theft',
  'accident',
  'suspicious_activity',
  'harassment',
  'fire',
  'flood',
  'power_outage',
  'road_closure',
  'other'
);

-- Create enum for alert severity
CREATE TYPE alert_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Create enum for alert status
CREATE TYPE alert_status AS ENUM (
  'active',
  'resolved',
  'investigating',
  'false_alarm'
);

-- Create safety_alerts table
CREATE TABLE public.safety_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  alert_type safety_alert_type NOT NULL,
  severity alert_severity DEFAULT 'medium',
  status alert_status DEFAULT 'active',
  latitude DECIMAL(10, 8), -- GPS coordinates
  longitude DECIMAL(11, 8),
  address TEXT,
  images TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create emergency_contacts table
CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  relationship TEXT, -- family, friend, neighbor, etc.
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create panic_alerts table
CREATE TABLE public.panic_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  message TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create alert_notifications table for tracking who was notified
CREATE TABLE public.alert_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.safety_alerts(id) ON DELETE CASCADE,
  panic_alert_id UUID REFERENCES public.panic_alerts(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- email, sms, push, in_app
  sent_at TIMESTAMPTZ DEFAULT now(),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ
);

-- Create alert_responses table for community responses
CREATE TABLE public.alert_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES public.safety_alerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response_type TEXT NOT NULL, -- confirmed, helpful, resolved, false_alarm
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panic_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for safety_alerts
CREATE POLICY "Users can view safety alerts in their area" ON public.safety_alerts
  FOR SELECT USING (true); -- Allow all users to see safety alerts for community safety

CREATE POLICY "Users can create safety alerts" ON public.safety_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" ON public.safety_alerts
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = verified_by);

CREATE POLICY "Admins can verify alerts" ON public.safety_alerts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS Policies for emergency_contacts
CREATE POLICY "Users can manage their own emergency contacts" ON public.emergency_contacts
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for panic_alerts
CREATE POLICY "Users can view panic alerts" ON public.panic_alerts
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can create panic alerts" ON public.panic_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authorized users can resolve panic alerts" ON public.panic_alerts
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS Policies for alert_notifications
CREATE POLICY "Users can view their own notifications" ON public.alert_notifications
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "System can create notifications" ON public.alert_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their notification status" ON public.alert_notifications
  FOR UPDATE USING (auth.uid() = recipient_id);

-- RLS Policies for alert_responses
CREATE POLICY "Users can view alert responses" ON public.alert_responses
  FOR SELECT USING (true);

CREATE POLICY "Users can create alert responses" ON public.alert_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_safety_alerts_location ON public.safety_alerts(latitude, longitude);
CREATE INDEX idx_safety_alerts_severity ON public.safety_alerts(severity);
CREATE INDEX idx_safety_alerts_status ON public.safety_alerts(status);
CREATE INDEX idx_safety_alerts_type ON public.safety_alerts(alert_type);
CREATE INDEX idx_safety_alerts_created_at ON public.safety_alerts(created_at);
CREATE INDEX idx_panic_alerts_location ON public.panic_alerts(latitude, longitude);
CREATE INDEX idx_panic_alerts_created_at ON public.panic_alerts(created_at);
CREATE INDEX idx_emergency_contacts_user_id ON public.emergency_contacts(user_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_safety_alerts_updated_at
  BEFORE UPDATE ON public.safety_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate distance between coordinates
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    6371 * acos(
      cos(radians(lat1)) * cos(radians(lat2)) * 
      cos(radians(lon2) - radians(lon1)) + 
      sin(radians(lat1)) * sin(radians(lat2))
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;