-- Update call_signaling type check constraint to include all supported types
ALTER TABLE public.call_signaling DROP CONSTRAINT IF EXISTS call_signaling_type_check;
ALTER TABLE public.call_signaling
ADD CONSTRAINT call_signaling_type_check CHECK (
        type IN (
            'offer',
            'answer',
            'ice',
            'ice-candidate',
            'reject',
            'decline',
            'end',
            'restart',
            'busy',
            'renegotiate',
            'renegotiate-answer',
            'timeout',
            'ringing'
        )
    );