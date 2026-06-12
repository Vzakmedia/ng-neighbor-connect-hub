-- Follow-up to 20260612160000: the constraint names used there already exist
-- as auto-named FKs to auth.users (created by the original table DDL), so the
-- guarded ALTERs were skipped and no profiles FKs were created. auth.users
-- FKs are invisible to PostgREST embedding (cross-schema), hence the embeds
-- still 400.
--
-- Create the profiles FKs under distinct fk_*_profile names. Client embed
-- hints are updated to match. Unnamed profiles(...) embeds also resolve,
-- since each table then has exactly one FK to profiles.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_direct_messages_sender_profile') THEN
    ALTER TABLE public.direct_messages
      ADD CONSTRAINT fk_direct_messages_sender_profile
      FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id)
      ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_alert_responses_user_profile') THEN
    ALTER TABLE public.alert_responses
      ADD CONSTRAINT fk_alert_responses_user_profile
      FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
      ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_content_reports_reporter_profile') THEN
    ALTER TABLE public.content_reports
      ADD CONSTRAINT fk_content_reports_reporter_profile
      FOREIGN KEY (reporter_id) REFERENCES public.profiles(user_id)
      ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_services_user_profile') THEN
    ALTER TABLE public.services
      ADD CONSTRAINT fk_services_user_profile
      FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
      ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_recommendation_reviews_reviewer_profile') THEN
    ALTER TABLE public.recommendation_reviews
      ADD CONSTRAINT fk_recommendation_reviews_reviewer_profile
      FOREIGN KEY (reviewer_id) REFERENCES public.profiles(user_id)
      ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_recommendation_tips_user_profile') THEN
    ALTER TABLE public.recommendation_tips
      ADD CONSTRAINT fk_recommendation_tips_user_profile
      FOREIGN KEY (user_id) REFERENCES public.profiles(user_id)
      ON DELETE CASCADE NOT VALID;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
