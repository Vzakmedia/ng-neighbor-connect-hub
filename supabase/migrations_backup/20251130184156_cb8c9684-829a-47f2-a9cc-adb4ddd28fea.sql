-- Update CHECK constraint to include all signal types used by WebRTC V2
ALTER TABLE call_signaling DROP CONSTRAINT IF EXISTS call_signaling_type_check;

ALTER TABLE call_signaling ADD CONSTRAINT call_signaling_type_check 
CHECK (type IN ('offer', 'answer', 'ice', 'ice-candidate', 'reject', 'decline', 'end', 'restart', 'busy', 'renegotiate', 'renegotiate-answer', 'timeout'));