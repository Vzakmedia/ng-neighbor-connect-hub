-- Fix community_posts foreign key to point to profiles table
-- Drop the old foreign key pointing to auth.users
ALTER TABLE public.community_posts DROP CONSTRAINT IF EXISTS community_posts_user_id_fkey;

-- Add the correct foreign key pointing to profiles(user_id)
ALTER TABLE public.community_posts 
  ADD CONSTRAINT community_posts_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(user_id) 
  ON DELETE CASCADE;

-- Ensure index exists for performance
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';