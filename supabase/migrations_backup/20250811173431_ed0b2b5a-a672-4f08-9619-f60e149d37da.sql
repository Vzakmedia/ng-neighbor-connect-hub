-- Secure public.profiles with RLS while preserving app functionality

-- 1) Enable Row Level Security (safe if already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2) Drop any permissive existing policies (no-op if absent)
DROP POLICY IF EXISTS "Profiles: public read" ON public.profiles;
DROP POLICY IF EXISTS "Allow anonymous read on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;

-- 3) Read access
-- 3a) TEMPORARY: Allow authenticated users to read profiles to avoid breaking features
CREATE POLICY "Profiles: authenticated users can read (temporary)"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- 3b) Owners can read their own profile (explicit)
CREATE POLICY "Profiles: owners can read"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3c) Staff can read all profiles
CREATE POLICY "Profiles: staff can read"
  ON public.profiles
  FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin') OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'moderator') OR
    has_role(auth.uid(), 'manager') OR
    has_role(auth.uid(), 'support') OR
    has_role(auth.uid(), 'staff')
  );

-- 4) Write access
-- Owners can update their own profile
CREATE POLICY "Profiles: owners can update"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Staff can update profiles (for moderation/verification flows)
CREATE POLICY "Profiles: staff can update"
  ON public.profiles
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'super_admin') OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'moderator') OR
    has_role(auth.uid(), 'manager') OR
    has_role(auth.uid(), 'support') OR
    has_role(auth.uid(), 'staff')
  );

-- Insert: allow users to insert their own profile (in case triggers didn’t create it)
CREATE POLICY "Profiles: owners can insert"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Note: We intentionally do not provide a DELETE policy to prevent accidental deletions
