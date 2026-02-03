-- Update board posts policy for public board visibility
DROP POLICY IF EXISTS "Board members can view approved posts and their own posts" ON public.board_posts;
CREATE POLICY "Users can view approved board posts" 
ON public.board_posts 
FOR SELECT 
TO authenticated
USING (
  approval_status = 'approved' AND 
  EXISTS (
    SELECT 1 FROM public.discussion_boards 
    WHERE id = board_posts.board_id AND is_public = true
  )
  OR 
  (
    EXISTS (
      SELECT 1 FROM public.board_members 
      WHERE board_id = board_posts.board_id 
      AND user_id = auth.uid() 
      AND status = 'active'
    ) AND 
    (approval_status = 'approved' OR user_id = auth.uid() OR can_moderate_board_posts(board_id, auth.uid()))
  )
);