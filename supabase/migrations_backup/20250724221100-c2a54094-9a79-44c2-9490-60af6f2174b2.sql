-- Create board invite codes table
CREATE TABLE public.board_invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.discussion_boards(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  is_active BOOLEAN DEFAULT true,
  used_count INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT NULL -- NULL means unlimited uses
);

-- Enable RLS
ALTER TABLE public.board_invite_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Board admins can manage invite codes" 
ON public.board_invite_codes 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.board_members bm
    JOIN public.discussion_boards db ON bm.board_id = db.id
    WHERE bm.board_id = board_invite_codes.board_id 
    AND bm.user_id = auth.uid()
    AND (bm.role IN ('admin', 'moderator') OR db.creator_id = auth.uid())
  )
);

-- Create policy for using invite codes (public read for active codes)
CREATE POLICY "Active invite codes are viewable for joining" 
ON public.board_invite_codes 
FOR SELECT
USING (is_active = true AND expires_at > NOW());

-- Create index for faster lookups
CREATE INDEX idx_board_invite_codes_code ON public.board_invite_codes(code);
CREATE INDEX idx_board_invite_codes_board_active ON public.board_invite_codes(board_id, is_active);

-- Create function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_board_invite_code()
RETURNS TEXT AS $$
BEGIN
  RETURN substring(md5(random()::text || clock_timestamp()::text), 1, 8);
END;
$$ LANGUAGE plpgsql;