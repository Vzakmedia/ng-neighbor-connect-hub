-- Fix RLS policies on service_bookings.
-- Migration 20251021142217 changed client_id and provider_id FKs to reference
-- profiles(id) instead of auth.users(id). The old RLS policies compared auth.uid()
-- directly against these columns, which now store profiles.id — a different UUID.
-- This creates a helper function and replaces all three policies.

-- Stable helper: returns the current user's profile id (NULL if no profile yet)
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Drop the old policies that compared auth.uid() directly
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "Providers can update their bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "Providers can update booking status" ON public.service_bookings;

-- Recreate policies comparing against profiles.id via the helper
CREATE POLICY "Users can view their own bookings" ON public.service_bookings
  FOR SELECT USING (
    client_id = public.get_my_profile_id()
    OR provider_id = public.get_my_profile_id()
  );

CREATE POLICY "Users can create bookings" ON public.service_bookings
  FOR INSERT WITH CHECK (
    client_id = public.get_my_profile_id()
  );

CREATE POLICY "Users can update their bookings" ON public.service_bookings
  FOR UPDATE USING (
    provider_id = public.get_my_profile_id()
    OR client_id = public.get_my_profile_id()
  );
