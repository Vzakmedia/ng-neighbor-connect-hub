-- Process existing pending emergency contact requests

-- Create notifications for pending requests that don't have them
DO $$
DECLARE
    request_record RECORD;
    sender_profile RECORD;
BEGIN
    FOR request_record IN 
        SELECT * FROM public.emergency_contact_requests 
        WHERE status = 'pending' 
        AND notification_sent = false 
        AND recipient_id IS NOT NULL
    LOOP
        -- Get sender profile
        SELECT full_name, phone INTO sender_profile
        FROM public.profiles
        WHERE user_id = request_record.sender_id;
        
        -- Create notification if sender profile exists
        IF sender_profile.full_name IS NOT NULL THEN
            INSERT INTO public.alert_notifications (
                recipient_id,
                notification_type,
                sender_name,
                sender_phone,
                content,
                request_id
            ) VALUES (
                request_record.recipient_id,
                'contact_request',
                sender_profile.full_name,
                sender_profile.phone,
                sender_profile.full_name || ' wants to add you as an emergency contact',
                request_record.id
            )
            ON CONFLICT DO NOTHING;
            
            -- Mark as notified
            UPDATE public.emergency_contact_requests
            SET notification_sent = true, updated_at = now()
            WHERE id = request_record.id;
        END IF;
    END LOOP;
END $$;