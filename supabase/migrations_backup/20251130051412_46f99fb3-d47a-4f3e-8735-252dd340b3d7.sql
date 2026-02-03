-- Drop the existing CHECK constraint
ALTER TABLE call_signaling DROP CONSTRAINT IF EXISTS call_signaling_type_check;

-- Add updated CHECK constraint with all signal types
ALTER TABLE call_signaling ADD CONSTRAINT call_signaling_type_check 
CHECK (type IN ('offer', 'answer', 'ice', 'ice-candidate', 'reject', 'decline', 'end', 'restart', 'busy'));