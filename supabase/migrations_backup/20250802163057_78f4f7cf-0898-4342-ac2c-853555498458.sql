-- Enable real-time for tables that aren't already in publication
-- Set replica identity to FULL for tables that need real-time updates

-- Direct conversations - for unread message counts
ALTER TABLE public.direct_conversations REPLICA IDENTITY FULL;

-- Safety alerts - for emergency notifications  
ALTER TABLE public.safety_alerts REPLICA IDENTITY FULL;

-- Alert notifications - for general notifications
ALTER TABLE public.alert_notifications REPLICA IDENTITY FULL;

-- Community posts - for community feed updates
ALTER TABLE public.community_posts REPLICA IDENTITY FULL;

-- Post read status - for read tracking
ALTER TABLE public.post_read_status REPLICA IDENTITY FULL;

-- Call signaling - for WebRTC calls
ALTER TABLE public.call_signaling REPLICA IDENTITY FULL;

-- Emergency contact requests - for contact notifications
ALTER TABLE public.emergency_contact_requests REPLICA IDENTITY FULL;

-- Add tables to realtime publication (only those not already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_read_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signaling;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_contact_requests;