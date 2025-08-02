-- Enable real-time for critical tables
-- First, set replica identity to FULL for tables that need real-time updates

-- Direct messages - for real-time messaging
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Direct conversations - for unread message counts
ALTER TABLE public.direct_conversations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_conversations;

-- Safety alerts - for emergency notifications
ALTER TABLE public.safety_alerts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_alerts;

-- Alert notifications - for general notifications
ALTER TABLE public.alert_notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_notifications;

-- Community posts - for community feed updates
ALTER TABLE public.community_posts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;

-- Post read status - for read tracking
ALTER TABLE public.post_read_status REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_read_status;

-- Call signaling - for WebRTC calls
ALTER TABLE public.call_signaling REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signaling;

-- Emergency contact requests - for contact notifications
ALTER TABLE public.emergency_contact_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_contact_requests;