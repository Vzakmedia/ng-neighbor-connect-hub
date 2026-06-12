-- Add missing foreign keys to profiles so PostgREST profile embeds work.
--
-- Several live queries embed profiles (e.g. sender:profiles!direct_messages_
-- sender_id_fkey) but the FK they name never existed — confirmed 400
-- (PGRST200) against the live API. Constraint names match exactly what the
-- client queries reference.
--
-- NOT VALID: skips validation of existing rows (legacy orphans must not block
-- the constraint); new writes are still enforced. PostgREST detects NOT VALID
-- FKs for embedding.

DO $$
BEGIN
  -- Message toasts: sender name/avatar on incoming direct messages
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'direct_messages_sender_id_fkey') THEN
    ALTER TABLE public.direct_messages
      ADD CONSTRAINT direct_messages_sender_id_fkey
      FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id)
      ON DELETE CASCADE NOT VALID;
  END IF;

  -- Safety alert responses feed
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alert_responses_user_id_fkey') THEN
    ALTER TABLE public.alert_responses
      ADD CONSTRAINT alert_responses_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
      ON DELETE CASCADE NOT VALID;
  END IF;

  -- Staff dashboard content reports (reporter name)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_reports_reporter_id_fkey') THEN
    ALTER TABLE public.content_reports
      ADD CONSTRAINT content_reports_reporter_id_fkey
      FOREIGN KEY (reporter_id) REFERENCES public.profiles(user_id)
      ON DELETE CASCADE NOT VALID;
  END IF;

  -- Community services list (provider name/avatar)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_user_id_fkey') THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
      ON DELETE CASCADE NOT VALID;
  END IF;

  -- Recommendation detail page (reviewer / tip author)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recommendation_reviews_reviewer_id_fkey') THEN
    ALTER TABLE public.recommendation_reviews
      ADD CONSTRAINT recommendation_reviews_reviewer_id_fkey
      FOREIGN KEY (reviewer_id) REFERENCES public.profiles(user_id)
      ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recommendation_tips_user_id_fkey') THEN
    ALTER TABLE public.recommendation_tips
      ADD CONSTRAINT recommendation_tips_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
      ON DELETE CASCADE NOT VALID;
  END IF;
END $$;

-- Reload PostgREST's schema cache so the new relationships are embeddable
-- immediately (otherwise it waits for the next schema change/restart).
NOTIFY pgrst, 'reload schema';
