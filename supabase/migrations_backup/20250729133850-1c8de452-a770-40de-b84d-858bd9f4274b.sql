-- Step 5: Advanced analytics and reporting

-- Create analytics events table for detailed tracking
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL,
  event_action TEXT NOT NULL,
  event_label TEXT,
  user_id UUID,
  session_id TEXT,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  location TEXT,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user analytics table
CREATE TABLE public.user_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  sessions_count INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  posts_created INTEGER DEFAULT 0,
  posts_liked INTEGER DEFAULT 0,
  posts_shared INTEGER DEFAULT 0,
  comments_made INTEGER DEFAULT 0,
  marketplace_views INTEGER DEFAULT 0,
  marketplace_purchases INTEGER DEFAULT 0,
  services_booked INTEGER DEFAULT 0,
  events_attended INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  emergency_alerts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create content analytics table
CREATE TABLE public.content_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,4) DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(content_id, date)
);

-- Create revenue analytics table
CREATE TABLE public.revenue_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  revenue_source TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  average_transaction DECIMAL(8,2) DEFAULT 0,
  recurring_revenue DECIMAL(10,2) DEFAULT 0,
  refunds DECIMAL(10,2) DEFAULT 0,
  net_revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, revenue_source)
);

-- Create system performance table
CREATE TABLE public.system_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metric_type TEXT NOT NULL,
  metric_value DECIMAL(10,4) NOT NULL,
  metric_unit TEXT,
  additional_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics reports table
CREATE TABLE public.analytics_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  report_config JSONB NOT NULL DEFAULT '{}',
  generated_by UUID NOT NULL,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  file_url TEXT,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics_events
CREATE POLICY "System can insert analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policies for user_analytics
CREATE POLICY "System can manage user analytics" 
ON public.user_analytics 
FOR ALL 
USING (true);

CREATE POLICY "Admins can view all user analytics" 
ON public.user_analytics 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own analytics" 
ON public.user_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policies for content_analytics
CREATE POLICY "System can manage content analytics" 
ON public.content_analytics 
FOR ALL 
USING (true);

CREATE POLICY "Admins can view all content analytics" 
ON public.content_analytics 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for revenue_analytics
CREATE POLICY "Admins can manage revenue analytics" 
ON public.revenue_analytics 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for system_performance
CREATE POLICY "System can insert performance metrics" 
ON public.system_performance 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view system performance" 
ON public.system_performance 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for analytics_reports
CREATE POLICY "Admins can manage analytics reports" 
ON public.analytics_reports 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to track user activity
CREATE OR REPLACE FUNCTION public.track_user_activity(
  _user_id UUID,
  _activity_type TEXT,
  _activity_data JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update daily user analytics
  INSERT INTO public.user_analytics (user_id, date)
  VALUES (_user_id, CURRENT_DATE)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET
    posts_created = CASE 
      WHEN _activity_type = 'post_created' THEN user_analytics.posts_created + 1
      ELSE user_analytics.posts_created
    END,
    posts_liked = CASE 
      WHEN _activity_type = 'post_liked' THEN user_analytics.posts_liked + 1
      ELSE user_analytics.posts_liked
    END,
    posts_shared = CASE 
      WHEN _activity_type = 'post_shared' THEN user_analytics.posts_shared + 1
      ELSE user_analytics.posts_shared
    END,
    comments_made = CASE 
      WHEN _activity_type = 'comment_made' THEN user_analytics.comments_made + 1
      ELSE user_analytics.comments_made
    END,
    marketplace_views = CASE 
      WHEN _activity_type = 'marketplace_view' THEN user_analytics.marketplace_views + 1
      ELSE user_analytics.marketplace_views
    END,
    services_booked = CASE 
      WHEN _activity_type = 'service_booked' THEN user_analytics.services_booked + 1
      ELSE user_analytics.services_booked
    END,
    messages_sent = CASE 
      WHEN _activity_type = 'message_sent' THEN user_analytics.messages_sent + 1
      ELSE user_analytics.messages_sent
    END,
    emergency_alerts = CASE 
      WHEN _activity_type = 'emergency_alert' THEN user_analytics.emergency_alerts + 1
      ELSE user_analytics.emergency_alerts
    END,
    updated_at = now();
END;
$$;

-- Create function to get analytics summary
CREATE OR REPLACE FUNCTION public.get_analytics_summary(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_users BIGINT,
  new_users BIGINT,
  active_users BIGINT,
  total_posts BIGINT,
  total_engagement BIGINT,
  total_revenue DECIMAL,
  avg_session_time DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.profiles)::BIGINT as total_users,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at::DATE BETWEEN start_date AND end_date)::BIGINT as new_users,
    (SELECT COUNT(DISTINCT user_id) FROM public.user_analytics WHERE date BETWEEN start_date AND end_date)::BIGINT as active_users,
    (SELECT COUNT(*) FROM public.community_posts WHERE created_at::DATE BETWEEN start_date AND end_date)::BIGINT as total_posts,
    (SELECT COALESCE(SUM(posts_liked + posts_shared + comments_made), 0) FROM public.user_analytics WHERE date BETWEEN start_date AND end_date)::BIGINT as total_engagement,
    (SELECT COALESCE(SUM(net_revenue), 0) FROM public.revenue_analytics WHERE date BETWEEN start_date AND end_date)::DECIMAL as total_revenue,
    (SELECT COALESCE(AVG(time_spent_minutes), 0) FROM public.user_analytics WHERE date BETWEEN start_date AND end_date)::DECIMAL as avg_session_time;
END;
$$;

-- Create function to get top content by engagement
CREATE OR REPLACE FUNCTION public.get_top_content_by_engagement(
  content_type_filter TEXT DEFAULT NULL,
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
  end_date DATE DEFAULT CURRENT_DATE,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  content_id UUID,
  content_type TEXT,
  total_views BIGINT,
  total_likes BIGINT,
  total_shares BIGINT,
  total_comments BIGINT,
  engagement_score DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ca.content_id,
    ca.content_type,
    SUM(ca.views)::BIGINT as total_views,
    SUM(ca.likes)::BIGINT as total_likes,
    SUM(ca.shares)::BIGINT as total_shares,
    SUM(ca.comments)::BIGINT as total_comments,
    (SUM(ca.likes) * 3 + SUM(ca.shares) * 5 + SUM(ca.comments) * 4 + SUM(ca.views))::DECIMAL as engagement_score
  FROM public.content_analytics ca
  WHERE ca.date BETWEEN start_date AND end_date
    AND (content_type_filter IS NULL OR ca.content_type = content_type_filter)
  GROUP BY ca.content_id, ca.content_type
  ORDER BY engagement_score DESC
  LIMIT limit_count;
END;
$$;

-- Create trigger to update analytics timestamps
CREATE TRIGGER update_user_analytics_updated_at
  BEFORE UPDATE ON public.user_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_analytics_updated_at
  BEFORE UPDATE ON public.content_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_revenue_analytics_updated_at
  BEFORE UPDATE ON public.revenue_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample analytics data
INSERT INTO public.user_analytics (user_id, date, sessions_count, page_views, time_spent_minutes, posts_created, posts_liked, comments_made) VALUES 
((SELECT user_id FROM public.profiles LIMIT 1), CURRENT_DATE, 5, 25, 45, 2, 8, 3),
((SELECT user_id FROM public.profiles LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 3, 18, 32, 1, 5, 2),
((SELECT user_id FROM public.profiles LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 4, 22, 38, 3, 12, 5);

INSERT INTO public.revenue_analytics (date, revenue_source, amount, transaction_count, net_revenue) VALUES 
(CURRENT_DATE, 'promotions', 250.00, 5, 225.00),
(CURRENT_DATE - INTERVAL '1 day', 'promotions', 180.00, 3, 162.00),
(CURRENT_DATE, 'marketplace_fees', 45.00, 15, 45.00);

INSERT INTO public.system_performance (metric_type, metric_value, metric_unit) VALUES 
('response_time', 245.50, 'ms'),
('cpu_usage', 23.40, 'percent'),
('memory_usage', 67.80, 'percent'),
('active_connections', 125.00, 'count'),
('database_queries_per_second', 58.20, 'qps');