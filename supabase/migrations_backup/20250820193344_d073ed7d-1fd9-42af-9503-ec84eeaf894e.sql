-- Update RLS policies to allow all authenticated users to see each other's content
-- Only updating policies for tables that exist

-- Community Posts - Allow all authenticated users to view all posts
DROP POLICY IF EXISTS "Authenticated users can view community posts" ON public.community_posts;
CREATE POLICY "All authenticated users can view community posts" 
ON public.community_posts 
FOR SELECT 
TO authenticated
USING (true);

-- Marketplace Items - Allow all authenticated users to view all items
DROP POLICY IF EXISTS "Users can view approved marketplace items" ON public.marketplace_items;
CREATE POLICY "All authenticated users can view marketplace items" 
ON public.marketplace_items 
FOR SELECT 
TO authenticated
USING (approval_status = 'approved');

-- Services - Allow all authenticated users to view all services
DROP POLICY IF EXISTS "Users can view approved services" ON public.services;
CREATE POLICY "All authenticated users can view services" 
ON public.services 
FOR SELECT 
TO authenticated
USING (approval_status = 'approved');

-- Advertisement Campaigns - Allow all authenticated users to view active approved campaigns
DROP POLICY IF EXISTS "Users can view active advertisement campaigns" ON public.advertisement_campaigns;
CREATE POLICY "All authenticated users can view active ads" 
ON public.advertisement_campaigns 
FOR SELECT 
TO authenticated
USING (status = 'active' AND approval_status = 'approved');

-- Board Posts - Update to allow viewing approved posts for public boards
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

-- Discussion Boards - Allow all users to view public boards
DROP POLICY IF EXISTS "Users can view public discussion boards" ON public.discussion_boards;
CREATE POLICY "All users can view public discussion boards" 
ON public.discussion_boards 
FOR SELECT 
TO authenticated
USING (is_public = true OR is_board_member(id, auth.uid()) OR is_board_creator(id, auth.uid()));

-- Community Post Likes - Allow viewing likes on posts
DROP POLICY IF EXISTS "Users can view community post likes" ON public.community_post_likes;
CREATE POLICY "All authenticated users can view post likes" 
ON public.community_post_likes 
FOR SELECT 
TO authenticated
USING (true);

-- Community Post Comments - Allow viewing comments on posts
DROP POLICY IF EXISTS "Users can view community post comments" ON public.community_post_comments;
CREATE POLICY "All authenticated users can view post comments" 
ON public.community_post_comments 
FOR SELECT 
TO authenticated
USING (true);