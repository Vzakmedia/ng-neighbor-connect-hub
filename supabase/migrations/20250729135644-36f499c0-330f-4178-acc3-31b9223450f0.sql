-- Insert sample data for testing all admin functions

-- 1. Create sample app configurations
INSERT INTO public.app_configuration (config_key, config_type, config_value, description, is_public, updated_by)
VALUES 
  ('theme_settings', 'theme', '{"primary_color": "#3b82f6", "dark_mode": true}', 'Main application theme settings', true, 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48'),
  ('emergency_settings', 'emergency_settings', '{"auto_alert_radius": 5, "auto_resolve_false_alarms": false}', 'Emergency alert system configuration', false, 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48'),
  ('app_settings', 'app_settings', '{"max_posts_per_day": 10, "enable_notifications": true}', 'General application settings', false, 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48');

-- 2. Create sample platform automations
INSERT INTO public.platform_automations (name, description, automation_type, trigger_event, trigger_conditions, actions, is_active, created_by)
VALUES 
  ('Auto-approve marketplace items', 'Automatically approve marketplace items from verified users', 'approval_workflow', 'marketplace_item_created', '{"user_verified": true}', '[{"action": "approve_item"}]', true, 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48'),
  ('Emergency notification broadcast', 'Send notifications to nearby users during emergencies', 'notification', 'emergency_alert_created', '{"severity": "critical"}', '[{"action": "broadcast_notification", "radius": "5km"}]', true, 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48'),
  ('Content moderation flagging', 'Flag posts with inappropriate content', 'moderation', 'post_created', '{"contains_keywords": ["spam", "fake"]}', '[{"action": "flag_content"}]', false, 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48'),
  ('User engagement tracking', 'Track user engagement metrics', 'analytics', 'user_activity', '{}', '[{"action": "record_metrics"}]', true, 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48');

-- 3. Create sample automation logs
INSERT INTO public.automation_logs (automation_id, execution_status, execution_details, processing_time_ms)
SELECT 
  id, 
  CASE WHEN random() > 0.8 THEN 'failed' ELSE 'success' END,
  '{"processed_items": ' || floor(random() * 100) || ', "timestamp": "' || now() || '"}',
  floor(random() * 1000 + 50)
FROM public.platform_automations;

-- 4. Create sample content reports
INSERT INTO public.content_reports (content_id, content_type, reporter_id, reason, description, status)
VALUES 
  (gen_random_uuid(), 'community_post', 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'spam', 'This post contains spam content', 'pending'),
  (gen_random_uuid(), 'marketplace_item', 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'inappropriate', 'Item description is inappropriate', 'pending'),
  (gen_random_uuid(), 'community_post', 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'harassment', 'User harassment in comments', 'reviewed');

-- 5. Create sample sponsored content
INSERT INTO public.sponsored_content (user_id, content_type, content_id, budget, boost_level, target_audience, start_date, end_date, status)
VALUES 
  ('b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'community_post', gen_random_uuid(), 500.00, 3, '{"age_range": "18-35", "location": "Lagos"}', now(), now() + interval '30 days', 'active'),
  ('b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'marketplace_item', gen_random_uuid(), 250.00, 2, '{"interests": ["electronics", "gadgets"]}', now(), now() + interval '15 days', 'active'),
  ('b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'event', gen_random_uuid(), 1000.00, 5, '{"location": "Lagos", "interests": ["community"]}', now(), now() + interval '7 days', 'paused');

-- 6. Create sample revenue analytics
INSERT INTO public.revenue_analytics (date, revenue_source, amount, transaction_count, processing_fees, net_revenue)
VALUES 
  (CURRENT_DATE - interval '1 day', 'marketplace_fees', 150.00, 5, 15.00, 135.00),
  (CURRENT_DATE - interval '1 day', 'sponsored_content', 800.00, 3, 40.00, 760.00),
  (CURRENT_DATE - interval '2 days', 'marketplace_fees', 200.00, 8, 20.00, 180.00),
  (CURRENT_DATE - interval '2 days', 'sponsored_content', 500.00, 2, 25.00, 475.00),
  (CURRENT_DATE - interval '3 days', 'premium_features', 300.00, 10, 15.00, 285.00);

-- 7. Create sample user analytics
INSERT INTO public.user_analytics (user_id, date, posts_created, posts_liked, posts_shared, comments_made, marketplace_views, services_booked, messages_sent, emergency_alerts, time_spent_minutes)
VALUES 
  ('b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', CURRENT_DATE - interval '1 day', 3, 15, 5, 8, 12, 1, 25, 0, 45),
  ('b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', CURRENT_DATE - interval '2 days', 2, 20, 3, 12, 8, 0, 18, 1, 38),
  ('b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', CURRENT_DATE - interval '3 days', 5, 25, 8, 15, 20, 2, 35, 0, 62);

-- 8. Create sample content analytics
INSERT INTO public.content_analytics (content_id, content_type, date, views, likes, shares, comments, clicks, impressions, reach, engagement_rate)
VALUES 
  (gen_random_uuid(), 'community_post', CURRENT_DATE - interval '1 day', 150, 25, 5, 8, 45, 200, 180, 0.25),
  (gen_random_uuid(), 'marketplace_item', CURRENT_DATE - interval '1 day', 80, 12, 2, 3, 25, 120, 100, 0.22),
  (gen_random_uuid(), 'event', CURRENT_DATE - interval '2 days', 200, 40, 15, 20, 75, 300, 250, 0.30),
  (gen_random_uuid(), 'community_post', CURRENT_DATE - interval '2 days', 120, 18, 3, 5, 35, 150, 130, 0.21),
  (gen_random_uuid(), 'service', CURRENT_DATE - interval '3 days', 95, 8, 1, 2, 20, 110, 90, 0.12);

-- 9. Create sample system performance metrics
INSERT INTO public.system_performance (metric_type, metric_value, metric_unit, timestamp)
VALUES 
  ('response_time', 145, 'ms', now() - interval '5 minutes'),
  ('cpu_usage', 65, '%', now() - interval '5 minutes'),
  ('memory_usage', 72, '%', now() - interval '5 minutes'),
  ('active_connections', 234, 'count', now() - interval '5 minutes'),
  ('response_time', 152, 'ms', now() - interval '10 minutes'),
  ('cpu_usage', 68, '%', now() - interval '10 minutes'),
  ('memory_usage', 75, '%', now() - interval '10 minutes'),
  ('active_connections', 245, 'count', now() - interval '10 minutes');

-- 10. Create sample analytics events
INSERT INTO public.analytics_events (user_id, event_category, event_action, event_label, event_type, page_url, user_agent, browser, os, device_type, location, referrer, session_id, event_data)
VALUES 
  ('b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'user_interaction', 'post_like', 'community_post', 'click', '/community', 'Mozilla/5.0...', 'Chrome', 'Windows', 'desktop', 'Lagos', 'direct', 'session_123', '{"post_id": "123", "category": "general"}'),
  ('b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'navigation', 'page_view', 'marketplace', 'view', '/marketplace', 'Mozilla/5.0...', 'Chrome', 'Windows', 'desktop', 'Lagos', 'search', 'session_123', '{"page_load_time": 1.2}'),
  ('b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'commerce', 'item_view', 'electronics', 'view', '/marketplace/item/456', 'Mozilla/5.0...', 'Chrome', 'Windows', 'desktop', 'Lagos', 'marketplace', 'session_123', '{"item_id": "456", "price": 25000}');

-- 11. Create sample analytics reports
INSERT INTO public.analytics_reports (report_name, report_type, report_config, generated_by, date_range_start, date_range_end, status)
VALUES 
  ('User Engagement Report - January 2025', 'user_analytics', '{"metrics": ["posts", "engagement"], "format": "pdf"}', 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', '2025-01-01', '2025-01-31', 'completed'),
  ('Revenue Analysis Q1 2025', 'revenue_analytics', '{"breakdown": "by_source", "format": "excel"}', 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', '2025-01-01', '2025-03-31', 'pending'),
  ('Content Performance Weekly', 'content_analytics', '{"top_content": true, "engagement_metrics": true}', 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', '2025-01-20', '2025-01-27', 'completed');