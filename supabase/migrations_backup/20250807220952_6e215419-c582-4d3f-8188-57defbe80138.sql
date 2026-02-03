-- Fix emergency contact confirmation system

-- First, let's fix the trigger function to properly handle notifications
CREATE OR REPLACE FUNCTION public.trigger_contact_invitation_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Add a function to handle contact confirmation
CREATE OR REPLACE FUNCTION public.confirm_emergency_contact_request(
    _request_id UUID,
    _accept BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    request_record RECORD;
    sender_profile RECORD;
    recipient_profile RECORD;
    contact_id UUID;
    result JSONB;
BEGIN
    -- Get the request
    SELECT * INTO request_record
    FROM public.emergency_contact_requests
    WHERE id = _request_id AND recipient_id = auth.uid();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Request not found or access denied');
    END IF;
    
    -- Get sender and recipient profiles
    SELECT * INTO sender_profile FROM public.profiles WHERE user_id = request_record.sender_id;
    SELECT * INTO recipient_profile FROM public.profiles WHERE user_id = request_record.recipient_id;
    
    IF _accept THEN
        -- Create emergency contact for sender
        INSERT INTO public.emergency_contacts (
            user_id,
            contact_name,
            phone_number,
            relationship,
            preferred_methods,
            is_primary_contact,
            can_receive_location,
            can_alert_public,
            is_confirmed
        ) VALUES (
            request_record.sender_id,
            recipient_profile.full_name,
            recipient_profile.phone,
            'emergency_contact',
            ARRAY['in_app']::text[],
            false,
            true,
            false,
            true -- Auto-confirmed since they accepted
        ) RETURNING id INTO contact_id;
        
        -- Update request status
        UPDATE public.emergency_contact_requests
        SET status = 'accepted', updated_at = now()
        WHERE id = _request_id;
        
        result := jsonb_build_object(
            'success', true, 
            'message', 'Contact request accepted',
            'contact_id', contact_id
        );
    ELSE
        -- Update request status
        UPDATE public.emergency_contact_requests
        SET status = 'declined', updated_at = now()
        WHERE id = _request_id;
        
        result := jsonb_build_object(
            'success', true, 
            'message', 'Contact request declined'
        );
    END IF;
    
    -- Mark notification as read
    UPDATE public.alert_notifications
    SET is_read = true, read_at = now()
    WHERE request_id = _request_id;
    
    RETURN result;
END;
$$;

-- Update existing pending requests to trigger notifications
UPDATE public.emergency_contact_requests 
SET notification_sent = false, updated_at = now()
WHERE status = 'pending' AND notification_sent = false;