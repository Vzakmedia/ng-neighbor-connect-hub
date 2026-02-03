-- Create discussion boards table
CREATE TABLE public.discussion_boards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  creator_id uuid NOT NULL,
  is_public boolean DEFAULT true,
  member_limit integer DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  avatar_url text,
  location text
);

-- Create board members table
CREATE TABLE public.board_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id uuid NOT NULL REFERENCES public.discussion_boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member', -- 'admin', 'moderator', 'member'
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(board_id, user_id)
);

-- Create board posts table (posts specific to each board)
CREATE TABLE public.board_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id uuid NOT NULL REFERENCES public.discussion_boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  post_type text DEFAULT 'message',
  image_urls text[] DEFAULT ARRAY[]::text[],
  reply_to_id uuid REFERENCES public.board_posts(id),
  is_pinned boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create board post likes table
CREATE TABLE public.board_post_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.board_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.discussion_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discussion_boards
CREATE POLICY "Public boards are viewable by everyone" 
ON public.discussion_boards 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can view boards they are members of" 
ON public.discussion_boards 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.board_members 
  WHERE board_id = discussion_boards.id AND user_id = auth.uid()
));

CREATE POLICY "Users can create boards" 
ON public.discussion_boards 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Board creators and admins can update boards" 
ON public.discussion_boards 
FOR UPDATE 
USING (
  auth.uid() = creator_id OR 
  EXISTS (
    SELECT 1 FROM public.board_members 
    WHERE board_id = discussion_boards.id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- RLS Policies for board_members
CREATE POLICY "Users can view board members of boards they belong to" 
ON public.board_members 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.board_members bm 
  WHERE bm.board_id = board_members.board_id AND bm.user_id = auth.uid()
));

CREATE POLICY "Board creators can add members" 
ON public.board_members 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.discussion_boards 
  WHERE id = board_id AND creator_id = auth.uid()
));

CREATE POLICY "Admins can add members" 
ON public.board_members 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.board_members 
  WHERE board_id = board_members.board_id 
  AND user_id = auth.uid() 
  AND role = 'admin'
));

CREATE POLICY "Users can join public boards" 
ON public.board_members 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.discussion_boards 
    WHERE id = board_id AND is_public = true
  )
);

CREATE POLICY "Admins and creators can update member roles" 
ON public.board_members 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.discussion_boards db
  WHERE db.id = board_id AND (
    db.creator_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.board_members 
      WHERE board_id = db.id AND user_id = auth.uid() AND role = 'admin'
    )
  )
));

-- RLS Policies for board_posts
CREATE POLICY "Board members can view posts" 
ON public.board_posts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.board_members 
  WHERE board_id = board_posts.board_id AND user_id = auth.uid()
));

CREATE POLICY "Board members can create posts" 
ON public.board_posts 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.board_members 
    WHERE board_id = board_posts.board_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own posts" 
ON public.board_posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any posts in their boards" 
ON public.board_posts 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.board_members 
  WHERE board_id = board_posts.board_id 
  AND user_id = auth.uid() 
  AND role IN ('admin', 'moderator')
));

-- RLS Policies for board_post_likes
CREATE POLICY "Board members can view likes" 
ON public.board_post_likes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.board_posts bp
  JOIN public.board_members bm ON bp.board_id = bm.board_id
  WHERE bp.id = board_post_likes.post_id AND bm.user_id = auth.uid()
));

CREATE POLICY "Board members can like posts" 
ON public.board_post_likes 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.board_posts bp
    JOIN public.board_members bm ON bp.board_id = bm.board_id
    WHERE bp.id = board_post_likes.post_id AND bm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own likes" 
ON public.board_post_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create updated_at trigger for discussion_boards
CREATE TRIGGER update_discussion_boards_updated_at
  BEFORE UPDATE ON public.discussion_boards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for board_posts
CREATE TRIGGER update_board_posts_updated_at
  BEFORE UPDATE ON public.board_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for new tables
ALTER TABLE public.discussion_boards REPLICA IDENTITY FULL;
ALTER TABLE public.board_members REPLICA IDENTITY FULL;
ALTER TABLE public.board_posts REPLICA IDENTITY FULL;
ALTER TABLE public.board_post_likes REPLICA IDENTITY FULL;