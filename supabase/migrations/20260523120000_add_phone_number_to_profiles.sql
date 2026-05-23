-- Add phone_number column to profiles table if it doesn't already exist.
-- This fixes "column profiles_1.phone_number does not exist" errors when
-- joining safety_alerts with profiles and requesting phone_number.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number text;

-- Grant super_admin bypass so they can always read all profiles
-- (this is already handled by existing RLS policies, but ensure the column is accessible)
COMMENT ON COLUMN public.profiles.phone_number IS 'Optional phone number for the user profile';
