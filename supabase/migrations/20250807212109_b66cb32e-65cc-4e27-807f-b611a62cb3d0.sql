-- Create table to track dismissed emergency alerts for users
CREATE TABLE public.dismissed_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_id UUID NOT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, alert_id)
);

-- Enable RLS
ALTER TABLE public.dismissed_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own dismissed alerts" 
ON public.dismissed_alerts 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);