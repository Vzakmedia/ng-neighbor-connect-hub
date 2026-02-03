-- Update discussion boards policy for public visibility
DROP POLICY IF EXISTS "Users can view public discussion boards" ON public.discussion_boards;
CREATE POLICY "All users can view public discussion boards" 
ON public.discussion_boards 
FOR SELECT 
TO authenticated
USING (is_public = true OR is_board_member(id, auth.uid()) OR is_board_creator(id, auth.uid()));