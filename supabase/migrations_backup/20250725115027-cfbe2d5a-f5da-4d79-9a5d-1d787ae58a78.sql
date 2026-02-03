-- Fix critical search path vulnerabilities in database functions
-- Update functions to use secure search paths

CREATE OR REPLACE FUNCTION public.handle_new_user_messaging_prefs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    INSERT INTO public.messaging_preferences (user_id, allow_messages, show_read_receipts, show_online_status)
    VALUES (NEW.id, true, true, true)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_contact_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- This is just a placeholder function
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_contact_invitation_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    recipient_found BOOLEAN := false;
    sender_profile RECORD;
BEGIN
    -- Only process if this is a new contact request
    IF TG_OP = 'INSERT' THEN
        -- Check if recipient_id was set (user exists in app)
        IF NEW.recipient_id IS NOT NULL THEN
            recipient_found := true;
        END IF;
        
        -- Get sender information
        SELECT full_name, phone INTO sender_profile
        FROM public.profiles
        WHERE user_id = NEW.sender_id;
        
        -- Create notification directly if recipient exists
        IF recipient_found AND sender_profile.full_name IS NOT NULL THEN
            INSERT INTO public.alert_notifications (
                recipient_id,
                notification_type,
                sender_name,
                sender_phone,
                content,
                request_id
            ) VALUES (
                NEW.recipient_id,
                'contact_request',
                sender_profile.full_name,
                sender_profile.phone,
                sender_profile.full_name || ' wants to add you as an emergency contact',
                NEW.id
            );
            
            -- Mark as notified
            UPDATE public.emergency_contact_requests
            SET notification_sent = true
            WHERE id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_allows_direct_messages(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    allows_messages BOOLEAN;
BEGIN
    SELECT 
        COALESCE(mp.allow_messages, true) INTO allows_messages
    FROM 
        auth.users u
    LEFT JOIN 
        public.messaging_preferences mp ON u.id = mp.user_id
    WHERE 
        u.id = target_user_id;
    
    RETURN allows_messages;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, state, city, neighborhood)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'state',
    new.raw_user_meta_data ->> 'city',
    new.raw_user_meta_data ->> 'neighborhood'
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN (
    6371 * acos(
      cos(radians(lat1)) * cos(radians(lat2)) * 
      cos(radians(lon2) - radians(lon1)) + 
      sin(radians(lat1)) * sin(radians(lat2))
    )
  );
END;
$function$;

-- Add rate limiting table for panic button
CREATE TABLE IF NOT EXISTS public.panic_button_rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  last_panic_at timestamp with time zone NOT NULL DEFAULT now(),
  panic_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on rate limiting table
ALTER TABLE public.panic_button_rate_limit ENABLE ROW LEVEL SECURITY;

-- Create policy for rate limiting table
CREATE POLICY "Users can view their own rate limit data" 
ON public.panic_button_rate_limit 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rate limit data" 
ON public.panic_button_rate_limit 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rate limit data" 
ON public.panic_button_rate_limit 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_panic_rate_limit_user_id ON public.panic_button_rate_limit(user_id);
CREATE INDEX IF NOT EXISTS idx_panic_rate_limit_last_panic ON public.panic_button_rate_limit(last_panic_at);