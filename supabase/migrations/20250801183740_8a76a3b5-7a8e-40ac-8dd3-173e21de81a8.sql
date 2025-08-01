-- Create call signaling table for WebRTC signaling
CREATE TABLE public.call_signaling (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  message JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.call_signaling ENABLE ROW LEVEL SECURITY;

-- Create policies for call signaling
CREATE POLICY "Users can view signaling for their conversations"
ON public.call_signaling
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM direct_conversations dc
    WHERE dc.id = call_signaling.conversation_id
    AND (dc.user1_id = auth.uid() OR dc.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can insert signaling for their conversations"
ON public.call_signaling
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM direct_conversations dc
    WHERE dc.id = call_signaling.conversation_id
    AND (dc.user1_id = auth.uid() OR dc.user2_id = auth.uid())
  )
);

-- Add table to realtime publication for real-time signaling
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signaling;

-- Set replica identity for real-time updates
ALTER TABLE public.call_signaling REPLICA IDENTITY FULL;