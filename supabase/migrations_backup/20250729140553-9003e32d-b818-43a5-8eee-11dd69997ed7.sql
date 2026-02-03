-- Create sample data with valid content types (post instead of community_post)

-- Create sample content reports with correct types
INSERT INTO public.content_reports (content_id, content_type, reporter_id, reason, description, status)
VALUES 
  (gen_random_uuid(), 'post', 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'spam', 'This post contains spam content', 'pending'),
  (gen_random_uuid(), 'comment', 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'inappropriate', 'Comment content is inappropriate', 'pending'),
  (gen_random_uuid(), 'post', 'b5ea53ea-bb6e-4d12-84f4-ceddd6430c48', 'harassment', 'User harassment in comments', 'reviewed');

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