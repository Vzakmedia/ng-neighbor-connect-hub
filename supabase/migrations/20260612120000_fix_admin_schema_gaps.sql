-- Fix admin dashboard schema gaps.
--
-- 1. user_roles has no created_at column — Admin2FAGate's 7-day grace-period
--    query (select created_at) returned 400 on every admin page load.
--    Existing rows backfill with now(), giving current staff a fresh grace
--    period to enable 2FA.
--
-- 2. The promotions tables (promotion_campaigns, promoted_posts,
--    promotion_analytics) were defined in a Lovable-era migration whose
--    filename the CLI skips — they never reached the live database, while
--    PromotionManagement and admin stats query them (404s).
--    promotion_impressions already exists, so it is not recreated here.

-- ─── 1. user_roles.created_at ────────────────────────────────────────────────

ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- ─── 2. Promotions tables ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.promotion_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  budget DECIMAL(10,2) NOT NULL,
  spent_amount DECIMAL(10,2) DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  target_audience JSONB DEFAULT '{}',
  target_locations JSONB DEFAULT '[]',
  target_demographics JSONB DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promoted_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.promotion_campaigns(id) ON DELETE CASCADE,
  post_id UUID,
  post_type TEXT NOT NULL CHECK (post_type IN ('community_post', 'marketplace_item', 'service', 'event')),
  post_content JSONB NOT NULL,
  daily_budget DECIMAL(8,2) NOT NULL,
  cost_per_click DECIMAL(6,2) DEFAULT 0.50,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promotion_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promoted_post_id UUID NOT NULL REFERENCES public.promoted_posts(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend DECIMAL(8,2) DEFAULT 0,
  click_through_rate DECIMAL(5,4) DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  cost_per_conversion DECIMAL(8,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(promoted_post_id, date)
);

ALTER TABLE public.promotion_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promoted_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_analytics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promotion_campaigns' AND policyname = 'Users can manage their own campaigns') THEN
    CREATE POLICY "Users can manage their own campaigns"
      ON public.promotion_campaigns FOR ALL
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promotion_campaigns' AND policyname = 'Admins can view all campaigns') THEN
    CREATE POLICY "Admins can view all campaigns"
      ON public.promotion_campaigns FOR SELECT
      USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promoted_posts' AND policyname = 'Users can manage posts for their campaigns') THEN
    CREATE POLICY "Users can manage posts for their campaigns"
      ON public.promoted_posts FOR ALL
      USING (EXISTS (
        SELECT 1 FROM public.promotion_campaigns
        WHERE promotion_campaigns.id = promoted_posts.campaign_id
          AND promotion_campaigns.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promoted_posts' AND policyname = 'Active promoted posts are viewable by everyone') THEN
    CREATE POLICY "Active promoted posts are viewable by everyone"
      ON public.promoted_posts FOR SELECT
      USING (is_active = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promoted_posts' AND policyname = 'Admins can view all promoted posts') THEN
    CREATE POLICY "Admins can view all promoted posts"
      ON public.promoted_posts FOR SELECT
      USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'promotion_analytics' AND policyname = 'Users can view analytics for their campaigns') THEN
    CREATE POLICY "Users can view analytics for their campaigns"
      ON public.promotion_analytics FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM public.promoted_posts pp
        JOIN public.promotion_campaigns pc ON pp.campaign_id = pc.id
        WHERE pp.id = promotion_analytics.promoted_post_id
          AND pc.user_id = auth.uid()
      ));
  END IF;
END $$;

-- Keep updated_at fresh (function already exists in this project)
DROP TRIGGER IF EXISTS update_promotion_campaigns_updated_at ON public.promotion_campaigns;
CREATE TRIGGER update_promotion_campaigns_updated_at
  BEFORE UPDATE ON public.promotion_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_promoted_posts_updated_at ON public.promoted_posts;
CREATE TRIGGER update_promoted_posts_updated_at
  BEFORE UPDATE ON public.promoted_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
