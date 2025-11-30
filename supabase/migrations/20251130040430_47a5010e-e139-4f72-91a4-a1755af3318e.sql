-- Update call_signaling table schema
ALTER TABLE public.call_signaling 
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Update existing rows: set receiver_id from conversation participants if NULL
UPDATE public.call_signaling cs
SET receiver_id = COALESCE(
  receiver_id,
  (SELECT CASE 
    WHEN dc.user1_id = cs.sender_id THEN dc.user2_id 
    ELSE dc.user1_id 
  END
  FROM direct_conversations dc 
  WHERE dc.id = cs.conversation_id)
)
WHERE receiver_id IS NULL;

-- Set defaults for type and expires_at
UPDATE public.call_signaling 
SET 
  type = COALESCE(type, 'offer'),
  expires_at = COALESCE(expires_at, created_at + INTERVAL '2 minutes');

-- Delete duplicate rows, keeping only the most recent one
DELETE FROM public.call_signaling a
USING public.call_signaling b
WHERE a.id < b.id
  AND a.conversation_id = b.conversation_id
  AND a.sender_id = b.sender_id
  AND a.receiver_id = b.receiver_id
  AND a.type = b.type
  AND a.created_at = b.created_at;

-- Now make columns NOT NULL
ALTER TABLE public.call_signaling 
  ALTER COLUMN type SET NOT NULL,
  ALTER COLUMN expires_at SET NOT NULL,
  ALTER COLUMN receiver_id SET NOT NULL;

-- Add CHECK constraint for type
ALTER TABLE public.call_signaling 
  ADD CONSTRAINT call_signaling_type_check 
  CHECK (type IN ('offer', 'answer', 'ice', 'reject', 'end'));

-- Set default for expires_at
ALTER TABLE public.call_signaling 
  ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '2 minutes');

-- Add unique constraint for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS call_signaling_unique_message_idx
ON public.call_signaling(conversation_id, sender_id, receiver_id, type, created_at);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can insert their own call signals" ON public.call_signaling;
DROP POLICY IF EXISTS "Users can view call signals for their conversations" ON public.call_signaling;

-- Create new simplified RLS policies
CREATE POLICY "Call signaling: read own messages"
ON public.call_signaling FOR SELECT
USING (
  auth.uid() = sender_id
  OR auth.uid() = receiver_id
);

CREATE POLICY "Call signaling: insert only if sender is user"
ON public.call_signaling FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS call_signaling_receiver_idx ON public.call_signaling(receiver_id);
CREATE INDEX IF NOT EXISTS call_signaling_conv_idx ON public.call_signaling(conversation_id);
CREATE INDEX IF NOT EXISTS call_signaling_type_idx ON public.call_signaling(type);
CREATE INDEX IF NOT EXISTS call_signaling_expire_idx ON public.call_signaling(expires_at);

-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_call_signals()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.call_signaling
  WHERE expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-cleanup
DROP TRIGGER IF EXISTS call_signaling_cleanup ON public.call_signaling;
CREATE TRIGGER call_signaling_cleanup
AFTER INSERT ON public.call_signaling
EXECUTE FUNCTION cleanup_expired_call_signals();

-- Update call_logs table
ALTER TABLE public.call_logs 
  ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ;

-- Rename columns (only if they exist with old names)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'start_time') THEN
    ALTER TABLE public.call_logs RENAME COLUMN start_time TO started_at;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'call_logs' AND column_name = 'end_time') THEN
    ALTER TABLE public.call_logs RENAME COLUMN end_time TO ended_at;
  END IF;
END $$;

-- Update existing call_status values to match new constraint
UPDATE public.call_logs
SET call_status = CASE
  WHEN call_status = 'in_progress' THEN 'connected'
  WHEN call_status = 'completed' THEN 'ended'
  WHEN call_status = 'cancelled' THEN 'ended'
  WHEN call_status NOT IN ('initiated', 'ringing', 'missed', 'declined', 'failed', 'connected', 'ended') THEN 'ended'
  ELSE call_status
END;

-- Drop old CHECK constraint if exists
ALTER TABLE public.call_logs DROP CONSTRAINT IF EXISTS call_logs_call_status_check;

-- Add new CHECK constraint for status
ALTER TABLE public.call_logs 
  ADD CONSTRAINT call_logs_status_check 
  CHECK (call_status IN ('initiated', 'ringing', 'missed', 'declined', 'failed', 'connected', 'ended'));

-- Update call_logs RLS policies
DROP POLICY IF EXISTS "Users can view their own call logs" ON public.call_logs;
DROP POLICY IF EXISTS "System can insert call logs" ON public.call_logs;

CREATE POLICY "Users can see calls involving them"
ON public.call_logs FOR SELECT
USING (
  auth.uid() = caller_id
  OR auth.uid() = receiver_id
);

CREATE POLICY "System may insert logs"
ON public.call_logs FOR INSERT
WITH CHECK (true);