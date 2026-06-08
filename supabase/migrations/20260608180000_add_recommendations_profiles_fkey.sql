-- Add FK from recommendations.user_id → profiles.user_id so PostgREST
-- can resolve the joined profile (author) in a single query.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'recommendations_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.recommendations
      ADD CONSTRAINT recommendations_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
  END IF;
END$$;
