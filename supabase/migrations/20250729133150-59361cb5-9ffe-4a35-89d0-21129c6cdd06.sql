-- Step 4: Sponsored post promotion engine

-- Create promotion campaigns table
CREATE TABLE public.promotion_campaigns (
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create promoted posts table
CREATE TABLE public.promoted_posts (
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

-- Create promotion analytics table
CREATE TABLE public.promotion_analytics (
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

-- Create promotion impressions log table
CREATE TABLE public.promotion_impressions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promoted_post_id UUID NOT NULL REFERENCES public.promoted_posts(id) ON DELETE CASCADE,
  user_id UUID,
  user_location TEXT,
  user_demographics JSONB DEFAULT '{}',
  impression_type TEXT DEFAULT 'view' CHECK (impression_type IN ('view', 'click', 'conversion')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotion_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promoted_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_impressions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promotion_campaigns
CREATE POLICY "Users can manage their own campaigns" 
ON public.promotion_campaigns 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all campaigns" 
ON public.promotion_campaigns 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for promoted_posts
CREATE POLICY "Users can manage posts for their campaigns" 
ON public.promoted_posts 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.promotion_campaigns 
  WHERE promotion_campaigns.id = promoted_posts.campaign_id 
  AND promotion_campaigns.user_id = auth.uid()
));

CREATE POLICY "Active promoted posts are viewable by everyone" 
ON public.promoted_posts 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can view all promoted posts" 
ON public.promoted_posts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for promotion_analytics
CREATE POLICY "Users can view analytics for their campaigns" 
ON public.promotion_analytics 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.promoted_posts pp
  JOIN public.promotion_campaigns pc ON pp.campaign_id = pc.id
  WHERE pp.id = promotion_analytics.promoted_post_id 
  AND pc.user_id = auth.uid()
));

CREATE POLICY "System can update analytics" 
ON public.promotion_analytics 
FOR ALL 
USING (true);

CREATE POLICY "Admins can view all analytics" 
ON public.promotion_analytics 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for promotion_impressions
CREATE POLICY "System can log impressions" 
ON public.promotion_impressions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view impressions for their campaigns" 
ON public.promotion_impressions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.promoted_posts pp
  JOIN public.promotion_campaigns pc ON pp.campaign_id = pc.id
  WHERE pp.id = promotion_impressions.promoted_post_id 
  AND pc.user_id = auth.uid()
));

CREATE POLICY "Admins can view all impressions" 
ON public.promotion_impressions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to update promotion analytics
CREATE OR REPLACE FUNCTION public.update_promotion_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update daily analytics when a new impression is logged
  INSERT INTO public.promotion_analytics (promoted_post_id, date, impressions, clicks, conversions)
  VALUES (
    NEW.promoted_post_id, 
    CURRENT_DATE,
    CASE WHEN NEW.impression_type = 'view' THEN 1 ELSE 0 END,
    CASE WHEN NEW.impression_type = 'click' THEN 1 ELSE 0 END,
    CASE WHEN NEW.impression_type = 'conversion' THEN 1 ELSE 0 END
  )
  ON CONFLICT (promoted_post_id, date) 
  DO UPDATE SET
    impressions = promotion_analytics.impressions + CASE WHEN NEW.impression_type = 'view' THEN 1 ELSE 0 END,
    clicks = promotion_analytics.clicks + CASE WHEN NEW.impression_type = 'click' THEN 1 ELSE 0 END,
    conversions = promotion_analytics.conversions + CASE WHEN NEW.impression_type = 'conversion' THEN 1 ELSE 0 END,
    click_through_rate = CASE 
      WHEN (promotion_analytics.impressions + CASE WHEN NEW.impression_type = 'view' THEN 1 ELSE 0 END) > 0 
      THEN (promotion_analytics.clicks + CASE WHEN NEW.impression_type = 'click' THEN 1 ELSE 0 END)::DECIMAL / 
           (promotion_analytics.impressions + CASE WHEN NEW.impression_type = 'view' THEN 1 ELSE 0 END)::DECIMAL
      ELSE 0 
    END,
    conversion_rate = CASE 
      WHEN (promotion_analytics.clicks + CASE WHEN NEW.impression_type = 'click' THEN 1 ELSE 0 END) > 0 
      THEN (promotion_analytics.conversions + CASE WHEN NEW.impression_type = 'conversion' THEN 1 ELSE 0 END)::DECIMAL / 
           (promotion_analytics.clicks + CASE WHEN NEW.impression_type = 'click' THEN 1 ELSE 0 END)::DECIMAL
      ELSE 0 
    END,
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get active promoted content
CREATE OR REPLACE FUNCTION public.get_active_promoted_content(
  user_location TEXT DEFAULT NULL,
  content_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  promoted_post_id UUID,
  campaign_id UUID,
  post_type TEXT,
  post_content JSONB,
  priority INTEGER,
  cost_per_click DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.id,
    pp.campaign_id,
    pp.post_type,
    pp.post_content,
    pp.priority,
    pp.cost_per_click
  FROM public.promoted_posts pp
  JOIN public.promotion_campaigns pc ON pp.campaign_id = pc.id
  WHERE pp.is_active = true
    AND pc.status = 'active'
    AND pc.start_date <= now()
    AND pc.end_date >= now()
    AND pc.spent_amount < pc.budget
    AND (user_location IS NULL OR pc.target_locations = '[]'::jsonb OR pc.target_locations ? user_location)
  ORDER BY pp.priority DESC, RANDOM()
  LIMIT content_limit;
END;
$$;

-- Create function to log promotion impression
CREATE OR REPLACE FUNCTION public.log_promotion_impression(
  _promoted_post_id UUID,
  _user_id UUID DEFAULT NULL,
  _user_location TEXT DEFAULT NULL,
  _impression_type TEXT DEFAULT 'view'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.promotion_impressions (
    promoted_post_id,
    user_id,
    user_location,
    impression_type
  ) VALUES (
    _promoted_post_id,
    _user_id,
    _user_location,
    _impression_type
  );
END;
$$;

-- Create trigger for promotion analytics
CREATE TRIGGER update_promotion_analytics_trigger
  AFTER INSERT ON public.promotion_impressions
  FOR EACH ROW EXECUTE FUNCTION public.update_promotion_analytics();

-- Create trigger for updated_at columns
CREATE TRIGGER update_promotion_campaigns_updated_at
  BEFORE UPDATE ON public.promotion_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promoted_posts_updated_at
  BEFORE UPDATE ON public.promoted_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promotion_analytics_updated_at
  BEFORE UPDATE ON public.promotion_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample promotion campaign data
INSERT INTO public.promotion_campaigns (
  user_id,
  title,
  description,
  budget,
  start_date,
  end_date,
  status,
  target_audience,
  target_locations
) VALUES 
(
  (SELECT user_id FROM public.profiles LIMIT 1),
  'Local Business Promotion',
  'Promote local business services to neighborhood residents',
  500.00,
  now(),
  now() + interval '30 days',
  'active',
  '{"age_range": "25-45", "interests": ["home_improvement", "local_services"]}',
  '["Lagos", "Abuja"]'
);

-- Insert sample promoted post
INSERT INTO public.promoted_posts (
  campaign_id,
  post_type,
  post_content,
  daily_budget,
  cost_per_click
) VALUES (
  (SELECT id FROM public.promotion_campaigns LIMIT 1),
  'service',
  '{"title": "Professional Cleaning Services", "description": "Get your home sparkling clean with our professional cleaning team", "price": 15000, "category": "home_services"}',
  50.00,
  1.00
);