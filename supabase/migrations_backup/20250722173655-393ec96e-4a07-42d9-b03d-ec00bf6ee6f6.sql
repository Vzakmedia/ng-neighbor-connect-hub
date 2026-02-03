-- Create emergency situation types enum
CREATE TYPE emergency_situation_type AS ENUM (
  'medical_emergency',
  'fire',
  'break_in',
  'assault',
  'accident',
  'natural_disaster',
  'suspicious_activity',
  'domestic_violence',
  'other'
);

-- Create contact method enum
CREATE TYPE contact_method AS ENUM (
  'in_app',
  'sms',
  'whatsapp',
  'phone_call'
);

-- Add emergency situation type to panic_alerts
ALTER TABLE public.panic_alerts 
ADD COLUMN situation_type emergency_situation_type DEFAULT 'other';

-- Update emergency_contacts table to include contact preferences
ALTER TABLE public.emergency_contacts 
ADD COLUMN preferred_methods contact_method[] DEFAULT '{in_app}',
ADD COLUMN is_primary_contact boolean DEFAULT false,
ADD COLUMN can_receive_location boolean DEFAULT true,
ADD COLUMN can_alert_public boolean DEFAULT false;

-- Create emergency_preferences table for user-specific settings
CREATE TABLE public.emergency_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  auto_alert_contacts boolean DEFAULT true,
  auto_alert_public boolean DEFAULT true,
  share_location_with_contacts boolean DEFAULT true,
  share_location_with_public boolean DEFAULT false,
  default_situation_type emergency_situation_type DEFAULT 'other',
  countdown_duration integer DEFAULT 3,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on emergency_preferences
ALTER TABLE public.emergency_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for emergency_preferences
CREATE POLICY "Users can manage their own emergency preferences"
ON public.emergency_preferences
FOR ALL
USING (auth.uid() = user_id);

-- Create public emergency alerts table for area-wide alerts
CREATE TABLE public.public_emergency_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  panic_alert_id uuid NOT NULL,
  user_id uuid NOT NULL,
  situation_type emergency_situation_type NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  address text,
  radius_km numeric DEFAULT 5,
  is_active boolean DEFAULT true,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on public_emergency_alerts
ALTER TABLE public.public_emergency_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for public_emergency_alerts
CREATE POLICY "Users can create public alerts for their panic alerts"
ON public.public_emergency_alerts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view public alerts in their area"
ON public.public_emergency_alerts
FOR SELECT
USING (is_active = true);

CREATE POLICY "Alert creators and admins can update alerts"
ON public.public_emergency_alerts
FOR UPDATE
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Add trigger for updated_at on emergency_preferences
CREATE TRIGGER update_emergency_preferences_updated_at
BEFORE UPDATE ON public.emergency_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on public_emergency_alerts
CREATE TRIGGER update_public_emergency_alerts_updated_at
BEFORE UPDATE ON public.public_emergency_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_emergency_preferences_user_id ON public.emergency_preferences(user_id);
CREATE INDEX idx_public_emergency_alerts_location ON public.public_emergency_alerts(latitude, longitude) WHERE is_active = true;
CREATE INDEX idx_public_emergency_alerts_situation ON public.public_emergency_alerts(situation_type) WHERE is_active = true;

-- Insert default emergency preferences for existing users
INSERT INTO public.emergency_preferences (user_id)
SELECT DISTINCT user_id FROM public.profiles
ON CONFLICT DO NOTHING;