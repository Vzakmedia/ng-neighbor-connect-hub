-- Phase 4: Enhance alert_notifications table for better performance and extensibility

-- Add notification_metadata column for flexible data storage
ALTER TABLE public.alert_notifications 
ADD COLUMN IF NOT EXISTS notification_metadata jsonb DEFAULT '{}'::jsonb;

-- Add notification_category column for better filtering
ALTER TABLE public.alert_notifications 
ADD COLUMN IF NOT EXISTS notification_category text;

-- Create index on recipient_id and is_read for faster queries
CREATE INDEX IF NOT EXISTS idx_alert_notifications_recipient_unread 
ON public.alert_notifications(recipient_id, is_read) 
WHERE is_read = false;

-- Create index on recipient_id and sent_at for sorting
CREATE INDEX IF NOT EXISTS idx_alert_notifications_recipient_sent 
ON public.alert_notifications(recipient_id, sent_at DESC);

-- Create index on notification_type for filtering
CREATE INDEX IF NOT EXISTS idx_alert_notifications_type 
ON public.alert_notifications(notification_type);

-- Add comment to explain the table structure
COMMENT ON TABLE public.alert_notifications IS 
'Stores all user notifications including messages, alerts, and system notifications. Synced with frontend notification store.';

COMMENT ON COLUMN public.alert_notifications.notification_metadata IS 
'Flexible JSONB field for storing additional notification data like sender info, action URLs, etc.';

COMMENT ON COLUMN public.alert_notifications.notification_category IS 
'Category for filtering notifications: message, alert, emergency, system, etc.';
