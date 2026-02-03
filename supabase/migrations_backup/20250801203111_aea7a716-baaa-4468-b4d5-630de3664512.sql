-- Fix call_signaling INSERT policy to allow users to insert call signals
DROP POLICY IF EXISTS "Users can insert their own call signals" ON public.call_signaling;

CREATE POLICY "Users can insert call signals for their conversations" 
ON public.call_signaling 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM direct_conversations dc 
    WHERE dc.id = conversation_id 
    AND (dc.user1_id = auth.uid() OR dc.user2_id = auth.uid())
  )
);

-- Add UPDATE and DELETE policies for call_signaling
CREATE POLICY "Users can update call signals for their conversations" 
ON public.call_signaling 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM direct_conversations dc 
    WHERE dc.id = conversation_id 
    AND (dc.user1_id = auth.uid() OR dc.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can delete call signals for their conversations" 
ON public.call_signaling 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM direct_conversations dc 
    WHERE dc.id = conversation_id 
    AND (dc.user1_id = auth.uid() OR dc.user2_id = auth.uid())
  )
);

-- Check if call_logs table has proper structure and policies
-- Add RLS policies for call_logs if they don't exist
CREATE POLICY "Users can view their call logs" 
ON public.call_logs 
FOR SELECT 
USING (caller_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can insert their call logs" 
ON public.call_logs 
FOR INSERT 
WITH CHECK (caller_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can update their call logs" 
ON public.call_logs 
FOR UPDATE 
USING (caller_id = auth.uid() OR receiver_id = auth.uid());

-- Grant necessary permissions
GRANT ALL ON public.call_signaling TO authenticated;
GRANT ALL ON public.call_logs TO authenticated;