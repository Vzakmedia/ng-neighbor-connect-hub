-- Secure profiles while keeping app functional, and introduce a safe public profile surface
-- 1) Ensure RLS is enabled on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2) Clean up existing conflicting policies (no-op if missing)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles; -- common default
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated read profiles" ON public.profiles;

-- 3) Minimal, compatibility-first policies
-- a) Allow authenticated users to read profiles (prevents anonymous/public scraping immediately)
CREATE POLICY "Profiles: authenticated users can read"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- b) Strong ownership policies for mutations
CREATE POLICY "Profiles: owners can insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Profiles: owners can update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Profiles: owners can delete"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Optional: staff read-only access for support/admin workflows
DROP POLICY IF EXISTS "Profiles: staff can read" ON public.profiles;
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

-- 4) Create a dedicated, safe public profile table to support cross-user display without exposing sensitive data
CREATE TABLE IF NOT EXISTS public.public_profiles (
  user_id uuid PRIMARY KEY,
  display_name text,
  avatar_url text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on public_profiles
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read others' public profiles; no anon/public access
DROP POLICY IF EXISTS "Public profiles: anyone can read" ON public.public_profiles;
DROP POLICY IF EXISTS "Public profiles: authenticated can read" ON public.public_profiles;
CREATE POLICY "Public profiles: authenticated can read"
  ON public.public_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Only system/owner should modify their own public profile via trigger; block direct writes from clients
DROP POLICY IF EXISTS "Public profiles: block client writes" ON public.public_profiles;
CREATE POLICY "Public profiles: owner can write (via trigger only)"
  ON public.public_profiles
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- 5) Sync logic between profiles -> public_profiles
CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS trigger AS $$
BEGIN
  -- Upsert into public_profiles with safe fields only
  INSERT INTO public.public_profiles (user_id, display_name, avatar_url, is_verified, updated_at)
  VALUES (NEW.user_id, NEW.full_name, NEW.avatar_url, COALESCE(NEW.is_verified, false), now())
  ON CONFLICT (user_id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        avatar_url = EXCLUDED.avatar_url,
        is_verified = EXCLUDED.is_verified,
        updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.delete_public_profile()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.public_profiles WHERE user_id = OLD.user_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach triggers on profiles
DROP TRIGGER IF EXISTS trg_sync_public_profile ON public.profiles;
CREATE TRIGGER trg_sync_public_profile
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_public_profile();

DROP TRIGGER IF EXISTS trg_delete_public_profile ON public.profiles;
CREATE TRIGGER trg_delete_public_profile
AFTER DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.delete_public_profile();

-- 6) Backfill existing data
INSERT INTO public.public_profiles (user_id, display_name, avatar_url, is_verified)
SELECT p.user_id, p.full_name, p.avatar_url, COALESCE(p.is_verified, false)
FROM public.profiles p
ON CONFLICT (user_id) DO UPDATE
SET display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    is_verified = EXCLUDED.is_verified,
    updated_at = now();

-- 7) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_public_profiles_display_name ON public.public_profiles (lower(display_name));
