-- Create post_likes table for tracking likes on community posts
CREATE TABLE public.post_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create post_comments table for storing comments on community posts
CREATE TABLE public.post_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create comment_likes table for liking comments
CREATE TABLE public.comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_likes
CREATE POLICY "Users can view all post likes" 
ON public.post_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own likes" 
ON public.post_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON public.post_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for post_comments
CREATE POLICY "Users can view all post comments" 
ON public.post_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own comments" 
ON public.post_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.post_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.post_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for comment_likes
CREATE POLICY "Users can view all comment likes" 
ON public.comment_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own comment likes" 
ON public.comment_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment likes" 
ON public.comment_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updating post_comments updated_at
CREATE TRIGGER update_post_comments_updated_at
BEFORE UPDATE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraints (optional but good practice)
ALTER TABLE public.post_likes 
ADD CONSTRAINT post_likes_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE;

ALTER TABLE public.post_comments 
ADD CONSTRAINT post_comments_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE;

ALTER TABLE public.comment_likes 
ADD CONSTRAINT comment_likes_comment_id_fkey 
FOREIGN KEY (comment_id) REFERENCES public.post_comments(id) ON DELETE CASCADE;