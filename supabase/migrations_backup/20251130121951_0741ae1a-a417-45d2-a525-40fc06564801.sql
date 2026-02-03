-- Add session_id column to call_signaling table for tracking call sessions
ALTER TABLE call_signaling ADD COLUMN session_id UUID;

-- Create index for better query performance on session_id
CREATE INDEX idx_call_signaling_session_id ON call_signaling(session_id);

-- Add comment for documentation
COMMENT ON COLUMN call_signaling.session_id IS 'UUID to group all signaling messages (offer, answer, ICE candidates) belonging to the same call session';