-- Check automation type constraint and create valid sample data

-- Let me check what automation types are allowed
SELECT 
  constraint_name, 
  check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%automation_type%';

-- Insert sample data with correct automation types
INSERT INTO public.platform_automations (name, description, automation_type, trigger_event, trigger_conditions, actions, is_active, created_by)
VALUES 
  ('Emergency Alert Broadcast', 'Send notifications to nearby users during emergencies', 'notification', 'emergency_alert_created', '{"severity": "critical"}', '[{"action": "broadcast_notification", "radius": "5km"}]', true, 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48'),
  ('Content Moderation System', 'Flag posts with inappropriate content', 'moderation', 'post_created', '{"contains_keywords": ["spam", "fake"]}', '[{"action": "flag_content"}]', false, 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48'),
  ('User Analytics Tracker', 'Track user engagement metrics', 'analytics', 'user_activity', '{}', '[{"action": "record_metrics"}]', true, 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48'),
  ('Email Campaign Manager', 'Automated email campaigns for user engagement', 'notification', 'user_milestone', '{"milestone": "first_post"}', '[{"action": "send_email", "template": "welcome"}]', true, 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48');

-- Create sample content reports
INSERT INTO public.content_reports (content_id, content_type, reporter_id, reason, description, status)
VALUES 
  (gen_random_uuid(), 'community_post', 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'spam', 'This post contains spam content', 'pending'),
  (gen_random_uuid(), 'marketplace_item', 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'inappropriate', 'Item description is inappropriate', 'pending'),
  (gen_random_uuid(), 'community_post', 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'harassment', 'User harassment in comments', 'reviewed');

-- Create sample revenue analytics
INSERT INTO public.revenue_analytics (date, revenue_source, amount, transaction_count, processing_fees, net_revenue)
VALUES 
  (CURRENT_DATE - interval '1 day', 'marketplace_fees', 150.00, 5, 15.00, 135.00),
  (CURRENT_DATE - interval '1 day', 'sponsored_content', 800.00, 3, 40.00, 760.00),
  (CURRENT_DATE - interval '2 days', 'marketplace_fees', 200.00, 8, 20.00, 180.00),
  (CURRENT_DATE - interval '2 days', 'sponsored_content', 500.00, 2, 25.00, 475.00),
  (CURRENT_DATE - interval '3 days', 'premium_features', 300.00, 10, 15.00, 285.00);

-- Create sample user analytics
INSERT INTO public.user_analytics (user_id, date, posts_created, posts_liked, posts_shared, comments_made, marketplace_views, services_booked, messages_sent, emergency_alerts, time_spent_minutes)
VALUES 
  ('b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', CURRENT_DATE - interval '1 day', 3, 15, 5, 8, 12, 1, 25, 0, 45),
  ('b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', CURRENT_DATE - interval '2 days', 2, 20, 3, 12, 8, 0, 18, 1, 38),
  ('b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', CURRENT_DATE - interval '3 days', 5, 25, 8, 15, 20, 2, 35, 0, 62);

-- Create sample system performance metrics
INSERT INTO public.system_performance (metric_type, metric_value, metric_unit, timestamp)
VALUES 
  ('response_time', 145, 'ms', now() - interval '5 minutes'),
  ('cpu_usage', 65, '%', now() - interval '5 minutes'),
  ('memory_usage', 72, '%', now() - interval '5 minutes'),
  ('active_connections', 234, 'count', now() - interval '5 minutes');

-- Create sample analytics events
INSERT INTO public.analytics_events (user_id, event_category, event_action, event_label, event_type, page_url, user_agent, browser, os, device_type, location, referrer, session_id, event_data)
VALUES 
  ('b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'user_interaction', 'post_like', 'community_post', 'click', '/community', 'Mozilla/5.0...', 'Chrome', 'Windows', 'desktop', 'Lagos', 'direct', 'session_123', '{"post_id": "123", "category": "general"}'),
  ('b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'navigation', 'page_view', 'marketplace', 'view', '/marketplace', 'Mozilla/5.0...', 'Chrome', 'Windows', 'desktop', 'Lagos', 'search', 'session_123', '{"page_load_time": 1.2}');