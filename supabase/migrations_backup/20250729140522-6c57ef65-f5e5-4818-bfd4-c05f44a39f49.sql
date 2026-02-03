-- Create sample data with proper JSON formatting

-- Insert sample automations using valid types
INSERT INTO public.platform_automations (name, description, automation_type, trigger_event, trigger_conditions, actions, is_active, created_by)
VALUES 
  ('Emergency Alert System', 'Send notifications to nearby users during emergencies', 'content_moderation', 'emergency_alert_created', '{"severity": "critical"}', '[{"action": "broadcast_notification", "radius": "5km"}]', true, 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48'),
  ('Spam Content Filter', 'Flag posts with inappropriate content', 'content_moderation', 'post_created', '{"contains_keywords": ["spam", "fake"]}', '[{"action": "flag_content"}]', false, 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48');

-- Create sample content reports
INSERT INTO public.content_reports (content_id, content_type, reporter_id, reason, description, status)
VALUES 
  (gen_random_uuid(), 'community_post', 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'spam', 'This post contains spam content', 'pending'),
  (gen_random_uuid(), 'marketplace_item', 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'inappropriate', 'Item description is inappropriate', 'pending'),
  (gen_random_uuid(), 'community_post', 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'harassment', 'User harassment in comments', 'reviewed');

-- Create sample user analytics
INSERT INTO public.user_analytics (user_id, date, posts_created, posts_liked, posts_shared, comments_made, marketplace_views, services_booked, messages_sent, emergency_alerts, time_spent_minutes)
VALUES 
  ('b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', CURRENT_DATE - interval '1 day', 3, 15, 5, 8, 12, 1, 25, 0, 45),
  ('b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', CURRENT_DATE - interval '2 days', 2, 20, 3, 12, 8, 0, 18, 1, 38);

-- Create sample system performance metrics
INSERT INTO public.system_performance (metric_type, metric_value, metric_unit, timestamp)
VALUES 
  ('response_time', 145, 'ms', now() - interval '5 minutes'),
  ('cpu_usage', 65, '%', now() - interval '5 minutes'),
  ('memory_usage', 72, '%', now() - interval '5 minutes'),
  ('active_connections', 234, 'count', now() - interval '5 minutes');

-- Create automation logs with proper JSON casting
INSERT INTO public.automation_logs (automation_id, execution_status, execution_details, processing_time_ms)
SELECT 
  id, 
  'success',
  ('{"processed_items": ' || floor(random() * 100) || ', "timestamp": "' || now() || '"}')::jsonb,
  floor(random() * 1000 + 50)::integer
FROM public.platform_automations
LIMIT 3;