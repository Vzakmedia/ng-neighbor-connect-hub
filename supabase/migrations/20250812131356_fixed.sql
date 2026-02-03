-- Tighten safety_alerts data exposure by restricting public reads and relying on masked RPC for public consumers
-- 1) Ensure RLS is enabled on safety_alerts
ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;

-- 2) Drop any existing SELECT policies (including public/anon) to avoid accidental exposure
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'safety_alerts' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.safety_alerts', pol.policyname);
  END LOOP;
END $$;

-- 3) Create a strict SELECT policy for authenticated users only
CREATE POLICY "Authenticated users can view safety alerts"
ON public.safety_alerts
FOR SELECT
TO authenticated
USING (true);

-- 4) Ensure the public-friendly RPC for masked data is callable by anon/authenticated
GRANT EXECUTE ON FUNCTION public.get_public_safety_alerts() TO anon, authenticated;