-- Force PostgREST schema cache refresh by sending a NOTIFY signal
-- This will make the foreign keys immediately available

NOTIFY pgrst, 'reload schema';