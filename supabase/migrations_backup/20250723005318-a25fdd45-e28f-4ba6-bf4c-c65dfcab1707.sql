-- Create webhook function that triggers edge function for contact requests
CREATE OR REPLACE FUNCTION public.trigger_contact_invitation_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
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

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS trigger_contact_invitation_webhook_trigger ON public.emergency_contact_requests;
CREATE TRIGGER trigger_contact_invitation_webhook_trigger
    AFTER INSERT ON public.emergency_contact_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_contact_invitation_webhook();

-- Ensure emergency_contact_requests table has proper realtime enabled
ALTER TABLE public.emergency_contact_requests REPLICA IDENTITY FULL;