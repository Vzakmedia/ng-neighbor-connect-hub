-- Fix infinite recursion in board_members RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view board members of boards they belong to" ON public.board_members;
DROP POLICY IF EXISTS "Board creators can add members" ON public.board_members;
DROP POLICY IF EXISTS "Admins can add members" ON public.board_members;
DROP POLICY IF EXISTS "Users can join public boards" ON public.board_members;
DROP POLICY IF EXISTS "Admins and creators can update member roles" ON public.board_members;

-- Create a security definer function to check board membership safely
CREATE OR REPLACE FUNCTION public.is_board_member(board_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.board_members 
    WHERE board_members.board_id = is_board_member.board_id 
    AND board_members.user_id = is_board_member.user_id
  );
$$;

-- Create a security definer function to check board admin status
CREATE OR REPLACE FUNCTION public.is_board_admin(board_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.board_members 
    WHERE board_members.board_id = is_board_admin.board_id 
    AND board_members.user_id = is_board_admin.user_id 
    AND board_members.role IN ('admin', 'moderator')
  );
$$;

-- Create a security definer function to check if user is board creator
CREATE OR REPLACE FUNCTION public.is_board_creator(board_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.discussion_boards 
    WHERE discussion_boards.id = is_board_creator.board_id 
    AND discussion_boards.creator_id = is_board_creator.user_id
  );
$$;

-- New RLS policies for board_members that avoid recursion
CREATE POLICY "Users can view members of boards they belong to" 
ON public.board_members 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  public.is_board_member(board_id, auth.uid())
);

CREATE POLICY "Board creators can add members" 
ON public.board_members 
FOR INSERT 
WITH CHECK (
  public.is_board_creator(board_id, auth.uid()) OR
  public.is_board_admin(board_id, auth.uid())
);

CREATE POLICY "Users can join public boards themselves" 
ON public.board_members 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.discussion_boards 
    WHERE id = board_id AND is_public = true
  )
);

CREATE POLICY "Board creators and admins can update member roles" 
ON public.board_members 
FOR UPDATE 
USING (
  public.is_board_creator(board_id, auth.uid()) OR
  public.is_board_admin(board_id, auth.uid())
);

CREATE POLICY "Users can leave boards (delete their own membership)" 
ON public.board_members 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Board creators and admins can remove members" 
ON public.board_members 
FOR DELETE 
USING (
  public.is_board_creator(board_id, auth.uid()) OR
  public.is_board_admin(board_id, auth.uid())
);