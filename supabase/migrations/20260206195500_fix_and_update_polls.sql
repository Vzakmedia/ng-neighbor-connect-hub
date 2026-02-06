-- Add missing columns to polls table if they don't exist
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'polls'
        AND column_name = 'allow_multiple_choices'
) THEN
ALTER TABLE public.polls
ADD COLUMN allow_multiple_choices BOOLEAN DEFAULT false;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'polls'
        AND column_name = 'max_choices'
) THEN
ALTER TABLE public.polls
ADD COLUMN max_choices INTEGER DEFAULT 1;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'polls'
        AND column_name = 'closes_at'
) THEN
ALTER TABLE public.polls
ADD COLUMN closes_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '7 days';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'poll_options'
        AND column_name = 'option_order'
) THEN
ALTER TABLE public.poll_options
ADD COLUMN option_order INTEGER DEFAULT 0;
END IF;
END $$;
-- Verify RLS policies exist, if not create them
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'polls'
        AND policyname = 'Users can create polls'
) THEN CREATE POLICY "Users can create polls" ON public.polls FOR
INSERT WITH CHECK (
        auth.uid() = (
            SELECT user_id
            FROM public.community_posts
            WHERE id = post_id
        )
    );
END IF;
END $$;