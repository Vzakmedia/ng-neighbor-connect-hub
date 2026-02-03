-- Add foreign key from events to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_user_id_fkey'
  ) THEN
    ALTER TABLE public.events
    ADD CONSTRAINT events_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';