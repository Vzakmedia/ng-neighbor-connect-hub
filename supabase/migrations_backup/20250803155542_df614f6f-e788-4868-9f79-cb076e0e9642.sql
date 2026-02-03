-- Create error_logs table for centralized error tracking
CREATE TABLE public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  user_message TEXT NOT NULL,
  error_code TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  user_id UUID,
  route TEXT,
  stack_trace TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "System can insert error logs" 
ON public.error_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all error logs" 
ON public.error_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create index for better performance
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX idx_error_logs_timestamp ON public.error_logs(timestamp);
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);