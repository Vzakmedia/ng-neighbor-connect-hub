-- Create a function to automatically create safety alerts from panic alerts
CREATE OR REPLACE FUNCTION public.create_safety_alert_from_panic()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Create a safety alert for the panic alert
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
      ELSE 'Emergency Alert'
    END,
    COALESCE(NEW.message, 'Emergency assistance requested'),
    CASE 
      WHEN NEW.situation_type = 'medical_emergency' THEN 'accident'
      WHEN NEW.situation_type = 'fire' THEN 'fire'
      WHEN NEW.situation_type = 'break_in' THEN 'break_in'
      WHEN NEW.situation_type = 'accident' THEN 'accident'
      WHEN NEW.situation_type = 'violence' THEN 'harassment'
      ELSE 'other'
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
$$;

-- Create trigger to automatically create safety alerts from panic alerts
DROP TRIGGER IF EXISTS trigger_create_safety_alert_from_panic ON public.panic_alerts;
CREATE TRIGGER trigger_create_safety_alert_from_panic
  AFTER INSERT ON public.panic_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_safety_alert_from_panic();

-- Create a function to update safety alert status when panic alert is resolved  
CREATE OR REPLACE FUNCTION public.update_safety_alert_from_panic_resolution()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update the corresponding safety alert when panic alert is resolved
  IF NEW.is_resolved = true AND OLD.is_resolved = false THEN
    UPDATE public.safety_alerts 
    SET 
      status = 'resolved',
      verified_at = NEW.resolved_at,
      verified_by = NEW.resolved_by,
      updated_at = now()
    WHERE user_id = NEW.user_id 
      AND created_at = NEW.created_at
      AND severity = 'critical'
      AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update safety alerts when panic alerts are resolved
DROP TRIGGER IF EXISTS trigger_update_safety_alert_from_panic_resolution ON public.panic_alerts;
CREATE TRIGGER trigger_update_safety_alert_from_panic_resolution
  AFTER UPDATE ON public.panic_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_safety_alert_from_panic_resolution();