-- Create call_signals table for WebRTC signaling
CREATE TABLE public.call_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('offer', 'answer', 'ice-candidate', 'call-end')),
  data JSONB,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  call_type TEXT NOT NULL CHECK (call_type IN ('voice', 'video')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

-- Create policies for call signals
CREATE POLICY "Users can insert their own call signals" 
ON public.call_signals 
FOR INSERT 
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can view call signals sent to them" 
ON public.call_signals 
FOR SELECT 
USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

-- Create index for efficient querying
CREATE INDEX idx_call_signals_to_user_id ON public.call_signals(to_user_id);
CREATE INDEX idx_call_signals_call_id ON public.call_signals(call_id);

-- Create function to clean up old call signals (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_call_signals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.call_signals 
  WHERE created_at < now() - interval '1 hour';
END;
$$;