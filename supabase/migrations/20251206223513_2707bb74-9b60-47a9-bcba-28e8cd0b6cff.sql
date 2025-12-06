-- Drop the redundant AFTER INSERT trigger that tries to UPDATE recipient_id
-- This is problematic because recipient_id should be set BEFORE INSERT, not after
DROP TRIGGER IF EXISTS check_contact_recipient_trigger ON public.emergency_contact_requests;

-- Ensure the BEFORE INSERT trigger exists with correct function
DROP TRIGGER IF EXISTS trg_set_contact_recipient ON public.emergency_contact_requests;

-- Recreate the trigger as BEFORE INSERT to properly set recipient_id
CREATE TRIGGER trg_set_contact_recipient
  BEFORE INSERT ON public.emergency_contact_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_contact_recipient();