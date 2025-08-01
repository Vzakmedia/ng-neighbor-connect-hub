-- Create call_logs table to track call history
CREATE TABLE public.call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  caller_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  call_type TEXT NOT NULL CHECK (call_type IN ('voice', 'video')),
  call_status TEXT NOT NULL CHECK (call_status IN ('missed', 'answered', 'declined', 'failed', 'ended')) DEFAULT 'failed',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for call_logs
CREATE POLICY "Users can view call logs for their conversations" 
ON public.call_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.direct_conversations dc 
    WHERE dc.id = call_logs.conversation_id 
    AND (dc.user1_id = auth.uid() OR dc.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can create call logs for their calls" 
ON public.call_logs 
FOR INSERT 
WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update call logs for their calls" 
ON public.call_logs 
FOR UPDATE 
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Add indexes for better performance
CREATE INDEX idx_call_logs_conversation_id ON public.call_logs(conversation_id);
CREATE INDEX idx_call_logs_start_time ON public.call_logs(start_time);

-- Add trigger for updated_at
CREATE TRIGGER update_call_logs_updated_at
BEFORE UPDATE ON public.call_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();