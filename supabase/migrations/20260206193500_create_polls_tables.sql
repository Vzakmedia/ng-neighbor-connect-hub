-- Create polls table
CREATE TABLE IF NOT EXISTS public.polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    allow_multiple_choices BOOLEAN DEFAULT false,
    max_choices INTEGER DEFAULT 1,
    closes_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Create poll_options table
CREATE TABLE IF NOT EXISTS public.poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_order INTEGER NOT NULL,
    vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- Create poll_votes table (to track who voted)
CREATE TABLE IF NOT EXISTS public.poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(poll_id, user_id) -- Only allow one vote set per user per poll (logic handled in app for multiple choices, or we need to relax this uniqueness if multiple rows are stored per choice. Typically for multiple choice, we might store multiple rows or one row with array. If multiple rows, we remove this UNIQUE constraint or make it (option_id, user_id).  Wait, if a user can vote for multiple options, they will have multiple rows in poll_votes. So UNIQUE(poll_id, user_id) would PREVENT multiple choices. We should remove that constraint or change it.)
);
-- Re-thinking poll_votes constraint for multiple choices
-- If multiple choices are allowed, a user can have multiple rows for the same poll_id but different option_id.
-- So UNIQUE(poll_id, user_id) is WRONG for multiple choices.
-- We should ensure a user answers a poll only once "session-wise", but here the votes are individual selections.
-- Correct constraint: UNIQUE(user_id, option_id) to prevent voting for the SAME option twice.
ALTER TABLE public.poll_votes DROP CONSTRAINT IF EXISTS poll_votes_poll_id_user_id_key;
ALTER TABLE public.poll_votes
ADD CONSTRAINT poll_votes_user_id_option_id_key UNIQUE (user_id, option_id);
-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
-- RLS Policies
-- Polls: Visible to everyone (or similar to posts scope, simplified here to public/authenticated)
CREATE POLICY "Polls are viewable by everyone" ON public.polls FOR
SELECT USING (true);
CREATE POLICY "Users can create polls" ON public.polls FOR
INSERT WITH CHECK (
        auth.uid() = (
            SELECT user_id
            FROM public.community_posts
            WHERE id = post_id
        )
    );
-- Options: Viewable by everyone
CREATE POLICY "Poll options are viewable by everyone" ON public.poll_options FOR
SELECT USING (true);
CREATE POLICY "Users can create options" ON public.poll_options FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.polls p
                JOIN public.community_posts cp ON p.post_id = cp.id
            WHERE p.id = poll_id
                AND cp.user_id = auth.uid()
        )
    );
-- Votes: Viewable by everyone (to count them)
CREATE POLICY "Votes are viewable by everyone" ON public.poll_votes FOR
SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON public.poll_votes FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can remove their own votes" ON public.poll_votes FOR DELETE USING (auth.uid() = user_id);
-- Add simple realtime publication
ALTER PUBLICATION supabase_realtime
ADD TABLE public.polls;
ALTER PUBLICATION supabase_realtime
ADD TABLE public.poll_options;
ALTER PUBLICATION supabase_realtime
ADD TABLE public.poll_votes;