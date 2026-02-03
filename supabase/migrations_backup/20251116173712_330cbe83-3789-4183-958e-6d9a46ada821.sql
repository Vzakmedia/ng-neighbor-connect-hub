-- Create polls table
CREATE TABLE public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  closes_at TIMESTAMP WITH TIME ZONE NOT NULL,
  allow_multiple_choices BOOLEAN NOT NULL DEFAULT false,
  max_choices INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create poll_options table
CREATE TABLE public.poll_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create poll_votes table
CREATE TABLE public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, option_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_polls_post_id ON public.polls(post_id);
CREATE INDEX idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE INDEX idx_poll_votes_poll_id ON public.poll_votes(poll_id);
CREATE INDEX idx_poll_votes_user_id ON public.poll_votes(user_id);

-- Enable Row Level Security
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls table
CREATE POLICY "Users can view all polls"
  ON public.polls
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create polls for their own posts"
  ON public.polls
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.community_posts
      WHERE id = post_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own polls"
  ON public.polls
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.community_posts
      WHERE id = post_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own polls"
  ON public.polls
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.community_posts
      WHERE id = post_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for poll_options table
CREATE POLICY "Users can view all poll options"
  ON public.poll_options
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create poll options for their own polls"
  ON public.poll_options
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.polls p
      JOIN public.community_posts cp ON p.post_id = cp.id
      WHERE p.id = poll_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update options for their own polls"
  ON public.poll_options
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.polls p
      JOIN public.community_posts cp ON p.post_id = cp.id
      WHERE p.id = poll_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete options from their own polls"
  ON public.poll_options
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.polls p
      JOIN public.community_posts cp ON p.post_id = cp.id
      WHERE p.id = poll_id AND cp.user_id = auth.uid()
    )
  );

-- RLS Policies for poll_votes table
CREATE POLICY "Users can view all poll votes"
  ON public.poll_votes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own votes"
  ON public.poll_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON public.poll_votes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update polls updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_polls_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_polls_updated_at
  BEFORE UPDATE ON public.polls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_polls_updated_at_column();