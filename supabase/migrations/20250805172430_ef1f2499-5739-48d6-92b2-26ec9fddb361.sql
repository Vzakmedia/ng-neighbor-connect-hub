-- Add location scope and post approval settings to discussion_boards
ALTER TABLE public.discussion_boards 
ADD COLUMN IF NOT EXISTS location_scope text CHECK (location_scope IN ('neighborhood', 'city', 'state', 'public')) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_approve_members boolean DEFAULT true;

-- Add approval status to board_posts
ALTER TABLE public.board_posts 
ADD COLUMN IF NOT EXISTS approval_status text CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- Update existing posts to be approved by default
UPDATE public.board_posts SET approval_status = 'approved' WHERE approval_status IS NULL;

-- Add member status to board_members for pending approvals
ALTER TABLE public.board_members 
ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('active', 'pending', 'banned')) DEFAULT 'active';

-- Update existing members to be active
UPDATE public.board_members SET status = 'active' WHERE status IS NULL;

-- Create function to check if user can approve posts
CREATE OR REPLACE FUNCTION public.can_moderate_board_posts(board_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.board_members 
    WHERE board_members.board_id = can_moderate_board_posts.board_id 
    AND board_members.user_id = can_moderate_board_posts.user_id 
    AND board_members.role IN ('admin', 'moderator')
    AND board_members.status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.discussion_boards 
    WHERE discussion_boards.id = can_moderate_board_posts.board_id 
    AND discussion_boards.creator_id = can_moderate_board_posts.user_id
  );
$function$;

-- Update board posts policies to handle approval status
DROP POLICY IF EXISTS "Board members can view posts" ON public.board_posts;
CREATE POLICY "Board members can view approved posts and their own posts" 
ON public.board_posts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM board_members 
    WHERE board_members.board_id = board_posts.board_id 
    AND board_members.user_id = auth.uid()
    AND board_members.status = 'active'
  ) AND (
    approval_status = 'approved' OR 
    user_id = auth.uid() OR 
    can_moderate_board_posts(board_id, auth.uid())
  )
);

-- Allow board moderators to approve/reject posts
CREATE POLICY "Board moderators can update post approval status" 
ON public.board_posts 
FOR UPDATE 
USING (can_moderate_board_posts(board_id, auth.uid()));

-- Update board members policies for status management
DROP POLICY IF EXISTS "Board creators and admins can update member roles" ON public.board_members;
CREATE POLICY "Board creators and admins can update member roles and status" 
ON public.board_members 
FOR UPDATE 
USING (
  is_board_creator(board_id, auth.uid()) OR 
  is_board_admin(board_id, auth.uid())
);

-- Allow viewing pending members for admins
DROP POLICY IF EXISTS "Users can view members of boards they belong to" ON public.board_members;
CREATE POLICY "Users can view active members and admins can view all members" 
ON public.board_members 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (status = 'active' AND is_board_member(board_id, auth.uid())) OR 
  (can_moderate_board_posts(board_id, auth.uid()))
);