-- Add receiver_id to call_signaling table for targeted message delivery
ALTER TABLE call_signaling ADD COLUMN receiver_id uuid REFERENCES auth.users(id);

-- Create index for efficient filtering by receiver
CREATE INDEX idx_call_signaling_receiver_id ON call_signaling(receiver_id);

-- Add comment for documentation
COMMENT ON COLUMN call_signaling.receiver_id IS 'Target recipient user ID for this signaling message';