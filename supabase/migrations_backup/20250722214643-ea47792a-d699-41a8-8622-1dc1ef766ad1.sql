-- Add missing columns to alert_notifications table
ALTER TABLE public.alert_notifications 
ADD COLUMN IF NOT EXISTS sender_name text,
ADD COLUMN IF NOT EXISTS sender_phone text,
ADD COLUMN IF NOT EXISTS content text,
ADD COLUMN IF NOT EXISTS request_id uuid;

-- Create index for request_id
CREATE INDEX IF NOT EXISTS idx_alert_notifications_request_id
ON public.alert_notifications(request_id);

-- Add contact_request to notification_type
-- Since we found that notification_type is a text field, not an enum, no need to alter type
-- Notifications with type 'contact_request' will be accepted as is