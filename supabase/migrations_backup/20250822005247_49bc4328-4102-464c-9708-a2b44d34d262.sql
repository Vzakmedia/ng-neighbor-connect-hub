-- Add member visibility settings to discussion boards
ALTER TABLE public.discussion_boards 
ADD COLUMN IF NOT EXISTS allow_member_list boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_member_invites boolean DEFAULT true;