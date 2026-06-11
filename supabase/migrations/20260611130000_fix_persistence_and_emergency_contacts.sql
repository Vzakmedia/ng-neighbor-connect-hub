-- ============================================================================
-- Fix "doesn't save / reverts on refresh" bugs and emergency contact mechanics
--
-- Root cause for the persistence bugs: several tables the client writes to
-- are missing RLS policies for those verbs. Postgres then silently affects
-- 0 rows (no error), the UI updates optimistically, and the change reappears
-- (or disappears) on refresh.
-- ============================================================================

-- ─── 1. review_reactions: no policies at all in migrations ──────────────────
-- Reacting / un-reacting to recommendation reviews never persisted.
ALTER TABLE public.review_reactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'review_reactions'
      AND policyname = 'Anyone can view review reactions'
  ) THEN
    CREATE POLICY "Anyone can view review reactions"
      ON public.review_reactions FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'review_reactions'
      AND policyname = 'Users can add their own review reactions'
  ) THEN
    CREATE POLICY "Users can add their own review reactions"
      ON public.review_reactions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'review_reactions'
      AND policyname = 'Users can remove their own review reactions'
  ) THEN
    CREATE POLICY "Users can remove their own review reactions"
      ON public.review_reactions FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ─── 2. advertisement_campaigns: owners could not delete their campaigns ────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'advertisement_campaigns'
      AND policyname = 'Users can delete their own campaigns'
  ) THEN
    CREATE POLICY "Users can delete their own campaigns"
      ON public.advertisement_campaigns FOR DELETE
      USING (
        auth.uid() = user_id
        OR has_role(auth.uid(), 'super_admin')
        OR has_role(auth.uid(), 'admin')
      );
  END IF;
END $$;

-- ─── 3. newsletter_subscribers: admin "remove subscriber" never persisted ───
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'newsletter_subscribers'
      AND policyname = 'Admins can delete subscribers'
  ) THEN
    CREATE POLICY "Admins can delete subscribers"
      ON public.newsletter_subscribers FOR DELETE
      USING (
        has_role(auth.uid(), 'super_admin')
        OR has_role(auth.uid(), 'admin')
      );
  END IF;
END $$;

-- ─── 4. post_views: upsert needs UPDATE for the on-conflict path ─────────────
-- Repeat views hit the conflict branch (UPDATE) which RLS blocked silently.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'post_views'
      AND policyname = 'Users can update their own post views'
  ) THEN
    CREATE POLICY "Users can update their own post views"
      ON public.post_views FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- Emergency contact mechanics
-- ============================================================================

-- ─── 5. Normalized phone lookup helper ──────────────────────────────────────
-- Phone numbers are user-entered ("+2348012345678" vs "0801 234 5678"), so
-- exact string equality fails. Match on the last 10 digits instead.
CREATE OR REPLACE FUNCTION public.find_user_id_by_phone(_phone text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.user_id
  FROM public.profiles p
  WHERE p.phone IS NOT NULL
    AND length(regexp_replace(_phone, '\D', '', 'g')) >= 7
    AND RIGHT(regexp_replace(p.phone, '\D', '', 'g'), 10)
      = RIGHT(regexp_replace(_phone, '\D', '', 'g'), 10)
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.find_user_id_by_phone(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.find_user_id_by_phone(text) TO authenticated, service_role;

-- ─── 6. check_contact_recipient: requests never reached recipients whose ────
-- profile phone was formatted differently than the number the sender typed.
CREATE OR REPLACE FUNCTION public.check_contact_recipient()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.emergency_contact_requests ecr
  SET recipient_id = public.find_user_id_by_phone(NEW.recipient_phone)
  WHERE ecr.id = NEW.id
    AND ecr.recipient_id IS NULL
    AND public.find_user_id_by_phone(NEW.recipient_phone) IS NOT NULL;

  RETURN NEW;
END;
$$;

-- ─── 7. confirm_emergency_contact_request: accepting created a DUPLICATE ────
-- contact row for the sender instead of confirming the one they already
-- added — the original stayed "Pending" forever. Confirm the existing row
-- first; only insert if the sender has no matching contact yet.
CREATE OR REPLACE FUNCTION public.confirm_emergency_contact_request(
    _request_id UUID,
    _accept BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    request_record RECORD;
    recipient_profile RECORD;
    contact_id UUID;
    result JSONB;
BEGIN
    SELECT * INTO request_record
    FROM public.emergency_contact_requests
    WHERE id = _request_id AND recipient_id = auth.uid();

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Request not found or access denied');
    END IF;

    SELECT * INTO recipient_profile
    FROM public.profiles
    WHERE user_id = request_record.recipient_id;

    IF _accept THEN
        -- Find the sender's existing contact entry for this person
        -- (matched on normalized phone digits).
        SELECT ec.id INTO contact_id
        FROM public.emergency_contacts ec
        WHERE ec.user_id = request_record.sender_id
          AND RIGHT(regexp_replace(ec.phone_number, '\D', '', 'g'), 10)
            = RIGHT(regexp_replace(request_record.recipient_phone, '\D', '', 'g'), 10)
        ORDER BY ec.created_at DESC
        LIMIT 1;

        IF contact_id IS NOT NULL THEN
            UPDATE public.emergency_contacts
            SET is_confirmed = true
            WHERE user_id = request_record.sender_id
              AND RIGHT(regexp_replace(phone_number, '\D', '', 'g'), 10)
                = RIGHT(regexp_replace(request_record.recipient_phone, '\D', '', 'g'), 10);
        ELSE
            INSERT INTO public.emergency_contacts (
                user_id,
                contact_name,
                phone_number,
                relationship,
                preferred_methods,
                is_primary_contact,
                can_receive_location,
                can_alert_public,
                is_confirmed
            ) VALUES (
                request_record.sender_id,
                COALESCE(recipient_profile.full_name, 'Emergency Contact'),
                request_record.recipient_phone,
                'emergency_contact',
                ARRAY['in_app']::text[],
                false,
                true,
                false,
                true
            ) RETURNING id INTO contact_id;
        END IF;

        UPDATE public.emergency_contact_requests
        SET status = 'accepted', updated_at = now()
        WHERE id = _request_id;

        result := jsonb_build_object(
            'success', true,
            'message', 'Contact request accepted',
            'contact_id', contact_id
        );
    ELSE
        UPDATE public.emergency_contact_requests
        SET status = 'declined', updated_at = now()
        WHERE id = _request_id;

        result := jsonb_build_object(
            'success', true,
            'message', 'Contact request declined'
        );
    END IF;

    -- Mark the related notification as read
    UPDATE public.alert_notifications
    SET is_read = true, read_at = now()
    WHERE request_id = _request_id;

    RETURN result;
END;
$$;
