-- Allow managers to update business verification fields and ad campaign approvals
-- Note: RLS is already enabled on these tables. We add specific policies for manager role.

-- 1) Businesses: allow managers to perform UPDATEs (e.g., verification_status/is_verified)
DO $$
BEGIN
  -- Create policy only if it doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'businesses' AND policyname = 'Managers can update businesses'
  ) THEN
    CREATE POLICY "Managers can update businesses"
    ON public.businesses
    FOR UPDATE
    USING (has_role(auth.uid(), 'manager'::app_role))
    WITH CHECK (has_role(auth.uid(), 'manager'::app_role));
  END IF;
END $$;

-- 2) Advertisement campaigns: allow managers to approve/reject (UPDATE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'advertisement_campaigns' AND policyname = 'Managers can update campaign approvals'
  ) THEN
    CREATE POLICY "Managers can update campaign approvals"
    ON public.advertisement_campaigns
    FOR UPDATE
    USING (has_role(auth.uid(), 'manager'::app_role))
    WITH CHECK (has_role(auth.uid(), 'manager'::app_role));
  END IF;
END $$;