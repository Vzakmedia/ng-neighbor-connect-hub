-- Set a safe, fixed search_path for the remaining function flagged by the linter
ALTER FUNCTION public.cleanup_old_call_signals() SET search_path TO public;