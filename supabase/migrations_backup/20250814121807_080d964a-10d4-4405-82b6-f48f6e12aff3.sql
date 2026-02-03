-- Insert test alert data into the queue for testing
INSERT INTO alert_queue (alert_id, priority, status, metadata) VALUES 
(gen_random_uuid(), 5, 'pending', '{"test": true, "description": "Test alert for dashboard verification"}'),
(gen_random_uuid(), 3, 'pending', '{"test": true, "description": "Medium priority test alert"}'),
(gen_random_uuid(), 1, 'completed', '{"test": true, "description": "Completed test alert"}');

-- Insert some test analytics data
INSERT INTO alert_analytics (alert_id, metric_type, metric_value, user_id) VALUES 
(gen_random_uuid(), 'delivery', 1, NULL),
(gen_random_uuid(), 'view', 1, NULL),
(gen_random_uuid(), 'click', 1, NULL);