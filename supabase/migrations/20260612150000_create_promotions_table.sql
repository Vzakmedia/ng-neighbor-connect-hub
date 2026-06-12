-- The business-facing promotions feature (CreatePromotionDialog,
-- ManagePromotionDialog, ManagerDashboard) was built against a `promotions`
-- table that was never created — all its queries 404. This is a simpler,
-- separate concept from promotion_campaigns (the ad-campaign tables):
-- a flat "promote my business/listing" request with budget and duration.
-- Schema matches exactly what the existing UI reads and writes.

CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER DEFAULT 7,
  budget DECIMAL(10,2),
  target_audience TEXT DEFAULT 'local',
  promotion_type TEXT DEFAULT 'featured',
  website_url TEXT,
  contact_info TEXT,
  images TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'paused', 'rejected', 'completed', 'cancelled')),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promotions' AND policyname = 'Users can manage their own promotions') THEN
    CREATE POLICY "Users can manage their own promotions"
      ON public.promotions FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Managers and admins review and activate promotions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promotions' AND policyname = 'Staff can view all promotions') THEN
    CREATE POLICY "Staff can view all promotions"
      ON public.promotions FOR SELECT
      USING (
        has_role(auth.uid(), 'manager'::app_role)
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'super_admin'::app_role)
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promotions' AND policyname = 'Staff can update promotions') THEN
    CREATE POLICY "Staff can update promotions"
      ON public.promotions FOR UPDATE
      USING (
        has_role(auth.uid(), 'manager'::app_role)
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'super_admin'::app_role)
      );
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_promotions_updated_at ON public.promotions;
CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
