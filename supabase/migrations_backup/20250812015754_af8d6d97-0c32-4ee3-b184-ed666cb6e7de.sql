-- Secure emergency contacts data with strict RLS
-- 1) Ensure RLS is enabled on the table
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- 2) Clean up any existing policies to avoid conflicts (no-op if they don't exist)
DROP POLICY IF EXISTS "Emergency contacts: public read" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Emergency contacts: public write" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Emergency contacts: anyone can read" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Emergency contacts: users can read all" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Emergency contacts: users can modify all" ON public.emergency_contacts;

-- 3) Core policies: owner-only access
-- Allow users to view only their own emergency contacts
CREATE POLICY "Emergency contacts: owners can read"
  ON public.emergency_contacts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert contacts only for themselves
CREATE POLICY "Emergency contacts: owners can insert"
  ON public.emergency_contacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update only their own contacts
CREATE POLICY "Emergency contacts: owners can update"
  ON public.emergency_contacts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete only their own contacts
CREATE POLICY "Emergency contacts: owners can delete"
  ON public.emergency_contacts
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4) Optional: staff visibility for support workflows (read-only)
-- If you prefer to restrict even staff, you may remove this policy.
CREATE POLICY "Emergency contacts: staff can read"
  ON public.emergency_contacts
  FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin') OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'moderator') OR
    has_role(auth.uid(), 'manager') OR
    has_role(auth.uid(), 'support') OR
    has_role(auth.uid(), 'staff')
  );

-- Notes:
-- - We intentionally do NOT grant staff write access.
-- - Real-time subscriptions will respect the SELECT policy above.
-- - All queries in the app should already scope by user_id; these policies enforce it server-side.