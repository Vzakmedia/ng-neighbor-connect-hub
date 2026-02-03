-- Update community posts policy to allow all authenticated users to view all posts
DROP POLICY IF EXISTS "Authenticated users can view community posts" ON public.community_posts;
CREATE POLICY "All authenticated users can view community posts" 
ON public.community_posts 
FOR SELECT 
TO authenticated
USING (true);