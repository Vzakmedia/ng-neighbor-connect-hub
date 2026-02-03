-- Create security audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  action_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  risk_level text DEFAULT 'low'::text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on security audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security audit log
CREATE POLICY "Users can view their own security logs" ON public.security_audit_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert security logs" ON public.security_audit_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all security logs" ON public.security_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'moderator')
    )
  );

-- Fix the safety alert creation trigger to handle situation type mapping correctly
CREATE OR REPLACE FUNCTION public.create_safety_alert_from_panic()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create a safety alert for the panic alert with proper type mapping
  INSERT INTO public.safety_alerts (
    user_id,
    title,
    description,
    alert_type,
    severity,
    status,
    latitude,
    longitude,
    address,
    images,
    is_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.user_id,
    CASE 
      WHEN NEW.situation_type = 'medical_emergency' THEN 'Medical Emergency Alert'
      WHEN NEW.situation_type = 'fire' THEN 'Fire Emergency Alert'
      WHEN NEW.situation_type = 'break_in' THEN 'Break-in Emergency Alert'
      WHEN NEW.situation_type = 'accident' THEN 'Accident Emergency Alert'
      WHEN NEW.situation_type = 'violence' THEN 'Violence Emergency Alert'
      WHEN NEW.situation_type = 'assault' THEN 'Assault Emergency Alert'
      WHEN NEW.situation_type = 'domestic_violence' THEN 'Domestic Violence Emergency Alert'
      WHEN NEW.situation_type = 'suspicious_activity' THEN 'Suspicious Activity Alert'
      WHEN NEW.situation_type = 'natural_disaster' THEN 'Natural Disaster Alert'
      ELSE 'Emergency Alert'
    END,
    COALESCE(NEW.message, 'Emergency assistance requested'),
    -- Map situation types to safety_alert_type enum values
    CASE 
      WHEN NEW.situation_type = 'medical_emergency' THEN 'accident'::safety_alert_type
      WHEN NEW.situation_type = 'fire' THEN 'fire'::safety_alert_type
      WHEN NEW.situation_type = 'break_in' THEN 'break_in'::safety_alert_type
      WHEN NEW.situation_type = 'accident' THEN 'accident'::safety_alert_type
      WHEN NEW.situation_type = 'violence' THEN 'harassment'::safety_alert_type
      WHEN NEW.situation_type = 'assault' THEN 'harassment'::safety_alert_type
      WHEN NEW.situation_type = 'domestic_violence' THEN 'harassment'::safety_alert_type
      WHEN NEW.situation_type = 'suspicious_activity' THEN 'suspicious_activity'::safety_alert_type
      WHEN NEW.situation_type = 'natural_disaster' THEN 'other'::safety_alert_type
      ELSE 'other'::safety_alert_type
    END,
    'critical', -- All panic alerts are critical
    'active',   -- Start as active
    NEW.latitude,
    NEW.longitude,
    NEW.address,
    '{}', -- Empty array for images
    true, -- Panic alerts are automatically verified
    NEW.created_at,
    NEW.created_at
  );
  
  RETURN NEW;
END;
$function$;