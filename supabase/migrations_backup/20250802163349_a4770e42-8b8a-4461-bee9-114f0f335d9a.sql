-- Set replica identity to FULL for tables that need real-time updates
-- This ensures complete row data is captured during updates

ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
ALTER TABLE public.direct_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.safety_alerts REPLICA IDENTITY FULL;
ALTER TABLE public.alert_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.community_posts REPLICA IDENTITY FULL;
ALTER TABLE public.post_read_status REPLICA IDENTITY FULL;
ALTER TABLE public.call_signaling REPLICA IDENTITY FULL;
ALTER TABLE public.emergency_contact_requests REPLICA IDENTITY FULL;