-- Server-side 2FA session tracking.
-- Replaces sessionStorage.getItem('2fa_session_verified') as the authorization signal.
-- Admin2FAGate and ProtectedRoute query this table — it cannot be spoofed from the client.

CREATE TABLE IF NOT EXISTS public.user_2fa_sessions (
  user_id    uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  verified_at timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT now() + interval '12 hours'
);

ALTER TABLE public.user_2fa_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only read and upsert their own row (needed by the frontend after TOTP success).
CREATE POLICY "user_2fa_sessions_select_own"
  ON public.user_2fa_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_2fa_sessions_insert_own"
  ON public.user_2fa_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_2fa_sessions_update_own"
  ON public.user_2fa_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Purge expired rows periodically (called from a cron or on-insert trigger).
CREATE OR REPLACE FUNCTION public.purge_expired_2fa_sessions()
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  DELETE FROM public.user_2fa_sessions WHERE expires_at < now();
$$;

-- Auto-purge on each insert so the table stays small.
CREATE OR REPLACE FUNCTION public.trigger_purge_expired_2fa_sessions()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.purge_expired_2fa_sessions();
  RETURN NEW;
END;
$$;

CREATE TRIGGER purge_2fa_sessions_on_insert
  AFTER INSERT ON public.user_2fa_sessions
  FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_purge_expired_2fa_sessions();
