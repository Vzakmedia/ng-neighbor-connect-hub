-- Remove client-writable policies on user_2fa_sessions.
-- All writes now go through the verify-2fa Edge Function using the service role.
-- Clients retain SELECT only (to check their own session status).

DROP POLICY IF EXISTS "user_2fa_sessions_insert_own" ON public.user_2fa_sessions;
DROP POLICY IF EXISTS "user_2fa_sessions_update_own" ON public.user_2fa_sessions;
