-- Alert System Architecture Implementation

-- Create alert priority queue system
CREATE TABLE IF NOT EXISTS public.alert_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1, -- 1=critical, 2=high, 3=medium, 4=low
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processing_started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create alert targeting rules
CREATE TABLE IF NOT EXISTS public.alert_targeting_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL,
  rule_type TEXT NOT NULL, -- location, user_role, custom
  rule_criteria JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create notification delivery log
CREATE TABLE IF NOT EXISTS public.notification_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL,
  user_id UUID NOT NULL,
  delivery_channel TEXT NOT NULL, -- websocket, push, sms, email
  delivery_status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, delivered, failed
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create alert cache table for performance
CREATE TABLE IF NOT EXISTS public.alert_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  cache_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create alert analytics table
CREATE TABLE IF NOT EXISTS public.alert_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL,
  metric_type TEXT NOT NULL, -- views, clicks, dismissals, responses
  metric_value INTEGER DEFAULT 1,
  user_id UUID,
  location TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_alert_queue_priority_status ON public.alert_queue(priority, status, created_at);
CREATE INDEX IF NOT EXISTS idx_alert_queue_alert_id ON public.alert_queue(alert_id);
CREATE INDEX IF NOT EXISTS idx_targeting_rules_alert_id ON public.alert_targeting_rules(alert_id);
CREATE INDEX IF NOT EXISTS idx_delivery_log_alert_user ON public.notification_delivery_log(alert_id, user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_log_status ON public.notification_delivery_log(delivery_status, created_at);
CREATE INDEX IF NOT EXISTS idx_alert_cache_key ON public.alert_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_alert_cache_expires ON public.alert_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_alert_analytics_alert_id ON public.alert_analytics(alert_id, timestamp);

-- Enable RLS
ALTER TABLE public.alert_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_targeting_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alert_queue
CREATE POLICY "Admins can manage alert queue" ON public.alert_queue
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for alert_targeting_rules  
CREATE POLICY "Admins can manage targeting rules" ON public.alert_targeting_rules
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for notification_delivery_log
CREATE POLICY "Users can view their delivery logs" ON public.notification_delivery_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage delivery logs" ON public.notification_delivery_log
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for alert_cache
CREATE POLICY "System can manage alert cache" ON public.alert_cache
  FOR ALL USING (true);

-- RLS Policies for alert_analytics
CREATE POLICY "Users can create analytics for their actions" ON public.alert_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all analytics" ON public.alert_analytics
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Create functions for alert processing

-- Function to process alert queue
CREATE OR REPLACE FUNCTION public.process_alert_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    queue_item RECORD;
BEGIN
    -- Get next pending item with highest priority
    SELECT * INTO queue_item
    FROM public.alert_queue
    WHERE status = 'pending' AND retry_count < max_retries
    ORDER BY priority ASC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    IF queue_item.id IS NOT NULL THEN
        -- Mark as processing
        UPDATE public.alert_queue
        SET status = 'processing', processing_started_at = now()
        WHERE id = queue_item.id;
        
        -- Here would be the actual processing logic
        -- For now, mark as completed
        UPDATE public.alert_queue
        SET status = 'completed', completed_at = now()
        WHERE id = queue_item.id;
    END IF;
END;
$$;

-- Function to add alert to queue
CREATE OR REPLACE FUNCTION public.enqueue_alert(
    _alert_id UUID,
    _priority INTEGER DEFAULT 3
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    queue_id UUID;
BEGIN
    INSERT INTO public.alert_queue (alert_id, priority)
    VALUES (_alert_id, _priority)
    RETURNING id INTO queue_id;
    
    RETURN queue_id;
END;
$$;

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION public.clean_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    DELETE FROM public.alert_cache
    WHERE expires_at < now();
END;
$$;

-- Function to get cached alert data
CREATE OR REPLACE FUNCTION public.get_cached_alerts(_cache_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    cached_data JSONB;
BEGIN
    SELECT cache_data INTO cached_data
    FROM public.alert_cache
    WHERE cache_key = _cache_key AND expires_at > now();
    
    RETURN cached_data;
END;
$$;

-- Function to set alert cache
CREATE OR REPLACE FUNCTION public.set_alert_cache(
    _cache_key TEXT,
    _cache_data JSONB,
    _ttl_seconds INTEGER DEFAULT 300
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.alert_cache (cache_key, cache_data, expires_at)
    VALUES (_cache_key, _cache_data, now() + (_ttl_seconds || ' seconds')::interval)
    ON CONFLICT (cache_key)
    DO UPDATE SET
        cache_data = _cache_data,
        expires_at = now() + (_ttl_seconds || ' seconds')::interval,
        updated_at = now();
END;
$$;

-- Function to track alert analytics
CREATE OR REPLACE FUNCTION public.track_alert_metric(
    _alert_id UUID,
    _metric_type TEXT,
    _user_id UUID DEFAULT NULL,
    _location TEXT DEFAULT NULL,
    _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.alert_analytics (alert_id, metric_type, user_id, location, metadata)
    VALUES (_alert_id, _metric_type, _user_id, _location, _metadata);
END;
$$;

-- Trigger to auto-enqueue new safety alerts
CREATE OR REPLACE FUNCTION public.auto_enqueue_safety_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    alert_priority INTEGER;
BEGIN
    -- Determine priority based on severity
    alert_priority := CASE NEW.severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 3
    END;
    
    -- Add to processing queue
    PERFORM public.enqueue_alert(NEW.id, alert_priority);
    
    RETURN NEW;
END;
$$;

-- Create trigger for auto-enqueueing
DROP TRIGGER IF EXISTS trigger_auto_enqueue_safety_alert ON public.safety_alerts;
CREATE TRIGGER trigger_auto_enqueue_safety_alert
    AFTER INSERT ON public.safety_alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_enqueue_safety_alert();

-- Add realtime publication for real-time updates
DROP PUBLICATION IF EXISTS alert_system_realtime;
CREATE PUBLICATION alert_system_realtime FOR TABLE 
    public.alert_queue,
    public.notification_delivery_log,
    public.alert_analytics;