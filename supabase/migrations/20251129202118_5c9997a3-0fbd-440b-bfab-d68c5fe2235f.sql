-- Create call_analytics table for tracking call events and debugging
CREATE TABLE IF NOT EXISTS public.call_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_log_id UUID REFERENCES public.call_logs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.direct_conversations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'call_initiated',
    'call_ringing',
    'call_connecting',
    'call_connected',
    'call_ended',
    'call_failed',
    'ice_restart',
    'ice_failed',
    'media_error',
    'signaling_error'
  )),
  event_data JSONB DEFAULT '{}'::jsonb,
  connection_time_ms INTEGER,
  total_duration_ms INTEGER,
  ice_connection_state TEXT,
  network_type TEXT,
  device_type TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_call_analytics_call_log_id ON public.call_analytics(call_log_id);
CREATE INDEX idx_call_analytics_user_id ON public.call_analytics(user_id);
CREATE INDEX idx_call_analytics_created_at ON public.call_analytics(created_at DESC);
CREATE INDEX idx_call_analytics_event_type ON public.call_analytics(event_type);

-- Enable RLS
ALTER TABLE public.call_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own call analytics"
  ON public.call_analytics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own call analytics"
  ON public.call_analytics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);