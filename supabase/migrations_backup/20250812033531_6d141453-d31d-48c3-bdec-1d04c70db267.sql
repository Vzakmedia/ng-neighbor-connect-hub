-- Restrict public access to board_invite_codes
-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.board_invite_codes ENABLE ROW LEVEL SECURITY;

-- Remove overly permissive public SELECT policy
DROP POLICY IF EXISTS "Active invite codes are viewable for joining" ON public.board_invite_codes;

-- Allow board members to view only active, non-expired invite codes for their boards
CREATE POLICY "Board members can view active invite codes for their boards"
ON public.board_invite_codes
FOR SELECT
USING (
  is_board_member(board_id, auth.uid())
  AND is_active = true
  AND expires_at > now()
);

-- Note: Admins and moderators (and creators) can already manage (including SELECT) via existing
-- "Board admins can manage invite codes" ALL policy.