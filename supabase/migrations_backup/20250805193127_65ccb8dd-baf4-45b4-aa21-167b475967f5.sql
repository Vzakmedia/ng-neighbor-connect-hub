-- Create advertising system tables

-- Advertisement pricing tiers
CREATE TABLE public.ad_pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  geographic_scope TEXT NOT NULL CHECK (geographic_scope IN ('city', 'state', 'nationwide')),
  ad_type TEXT NOT NULL CHECK (ad_type IN ('service', 'marketplace_item', 'business', 'community_post', 'event', 'direct_ad')),
  base_price_per_day DECIMAL(10,2) NOT NULL,
  impressions_included INTEGER DEFAULT 1000,
  click_rate_multiplier DECIMAL(3,2) DEFAULT 1.0,
  priority_level INTEGER DEFAULT 1,
  max_duration_days INTEGER DEFAULT 30,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Advertisement campaigns
CREATE TABLE public.advertisement_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_id UUID,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('service', 'marketplace_item', 'business', 'community_post', 'event', 'direct_ad')),
  
  -- Content references
  service_id UUID,
  marketplace_item_id UUID,
  community_post_id UUID,
  event_id UUID,
  
  -- Direct ad content (for custom ads)
  ad_title TEXT,
  ad_description TEXT,
  ad_images JSONB DEFAULT '[]'::jsonb,
  ad_url TEXT,
  ad_call_to_action TEXT,
  
  -- Geographic targeting
  target_geographic_scope TEXT NOT NULL CHECK (target_geographic_scope IN ('city', 'state', 'nationwide')),
  target_cities TEXT[] DEFAULT '{}',
  target_states TEXT[] DEFAULT '{}',
  target_coordinates JSONB, -- {lat, lng, radius_km}
  
  -- Pricing and duration
  pricing_tier_id UUID NOT NULL,
  daily_budget DECIMAL(10,2) NOT NULL,
  total_budget DECIMAL(10,2) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  
  -- Campaign status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_payment', 'pending_approval', 'active', 'paused', 'completed', 'rejected')),
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Payment tracking
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  stripe_session_id TEXT,
  payment_amount DECIMAL(10,2),
  payment_completed_at TIMESTAMPTZ,
  
  -- Performance tracking
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  FOREIGN KEY (pricing_tier_id) REFERENCES public.ad_pricing_tiers(id),
  FOREIGN KEY (service_id) REFERENCES public.services(id),
  FOREIGN KEY (marketplace_item_id) REFERENCES public.marketplace_items(id),
  FOREIGN KEY (community_post_id) REFERENCES public.community_posts(id)
);

-- Advertisement impressions and clicks tracking
CREATE TABLE public.ad_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  user_id UUID, -- nullable for anonymous users
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('impression', 'click', 'conversion')),
  user_location TEXT,
  device_type TEXT,
  referrer TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  FOREIGN KEY (campaign_id) REFERENCES public.advertisement_campaigns(id) ON DELETE CASCADE
);

-- Insert default pricing tiers
INSERT INTO public.ad_pricing_tiers (name, geographic_scope, ad_type, base_price_per_day, impressions_included, priority_level, features) VALUES
-- City level pricing
('City Basic Service', 'city', 'service', 5.00, 500, 1, '["Basic targeting", "Standard placement"]'),
('City Premium Service', 'city', 'service', 12.00, 1500, 2, '["Enhanced targeting", "Priority placement", "Rich media"]'),
('City Basic Marketplace', 'city', 'marketplace_item', 3.00, 300, 1, '["Basic targeting", "Standard placement"]'),
('City Premium Marketplace', 'city', 'marketplace_item', 8.00, 1000, 2, '["Enhanced targeting", "Priority placement"]'),
('City Business', 'city', 'business', 15.00, 2000, 3, '["Business verification badge", "Enhanced targeting", "Premium placement"]'),
('City Community Post', 'city', 'community_post', 2.00, 200, 1, '["Community boost", "Extended visibility"]'),
('City Event', 'city', 'event', 4.00, 400, 1, '["Event promotion", "Calendar integration"]'),
('City Direct Ad', 'city', 'direct_ad', 10.00, 1000, 2, '["Custom creative", "Flexible targeting"]'),

-- State level pricing
('State Basic Service', 'state', 'service', 25.00, 3000, 1, '["State-wide reach", "Basic targeting"]'),
('State Premium Service', 'state', 'service', 60.00, 8000, 2, '["State-wide reach", "Enhanced targeting", "Priority placement"]'),
('State Basic Marketplace', 'state', 'marketplace_item', 15.00, 2000, 1, '["State-wide reach", "Basic targeting"]'),
('State Premium Marketplace', 'state', 'marketplace_item', 40.00, 6000, 2, '["State-wide reach", "Enhanced targeting"]'),
('State Business', 'state', 'business', 75.00, 12000, 3, '["State-wide reach", "Business verification", "Premium placement"]'),
('State Community Post', 'state', 'community_post', 10.00, 1500, 1, '["State-wide community boost"]'),
('State Event', 'state', 'event', 20.00, 2500, 1, '["State-wide event promotion"]'),
('State Direct Ad', 'state', 'direct_ad', 50.00, 5000, 2, '["State-wide reach", "Custom creative"]'),

-- Nationwide pricing
('Nationwide Basic Service', 'nationwide', 'service', 100.00, 15000, 1, '["National reach", "Basic targeting"]'),
('Nationwide Premium Service', 'nationwide', 'service', 250.00, 40000, 2, '["National reach", "Enhanced targeting", "Priority placement"]'),
('Nationwide Basic Marketplace', 'nationwide', 'marketplace_item', 75.00, 10000, 1, '["National reach", "Basic targeting"]'),
('Nationwide Premium Marketplace', 'nationwide', 'marketplace_item', 200.00, 30000, 2, '["National reach", "Enhanced targeting"]'),
('Nationwide Business', 'nationwide', 'business', 300.00, 50000, 3, '["National reach", "Business verification", "Premium placement"]'),
('Nationwide Community Post', 'nationwide', 'community_post', 50.00, 8000, 1, '["National community boost"]'),
('Nationwide Event', 'nationwide', 'event', 100.00, 12000, 1, '["National event promotion"]'),
('Nationwide Direct Ad', 'nationwide', 'direct_ad', 200.00, 25000, 2, '["National reach", "Custom creative", "Premium placement"]');

-- Enable Row Level Security
ALTER TABLE public.ad_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisement_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ad_pricing_tiers
CREATE POLICY "Anyone can view active pricing tiers" 
ON public.ad_pricing_tiers 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage pricing tiers" 
ON public.ad_pricing_tiers 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- RLS Policies for advertisement_campaigns
CREATE POLICY "Users can view their own campaigns" 
ON public.advertisement_campaigns 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns" 
ON public.advertisement_campaigns 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" 
ON public.advertisement_campaigns 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all campaigns" 
ON public.advertisement_campaigns 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can update campaign approval status" 
ON public.advertisement_campaigns 
FOR UPDATE 
USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- RLS Policies for ad_interactions
CREATE POLICY "System can insert ad interactions" 
ON public.ad_interactions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view interactions for their campaigns" 
ON public.ad_interactions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.advertisement_campaigns 
  WHERE id = ad_interactions.campaign_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Admins can view all ad interactions" 
ON public.ad_interactions 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_ad_campaigns_user_id ON public.advertisement_campaigns(user_id);
CREATE INDEX idx_ad_campaigns_status ON public.advertisement_campaigns(status);
CREATE INDEX idx_ad_campaigns_geographic_scope ON public.advertisement_campaigns(target_geographic_scope);
CREATE INDEX idx_ad_campaigns_dates ON public.advertisement_campaigns(start_date, end_date);
CREATE INDEX idx_ad_interactions_campaign_id ON public.ad_interactions(campaign_id);
CREATE INDEX idx_ad_interactions_created_at ON public.ad_interactions(created_at);

-- Create function to get active advertisements for display
CREATE OR REPLACE FUNCTION public.get_active_advertisements(
  user_location TEXT DEFAULT NULL,
  user_city TEXT DEFAULT NULL,
  user_state TEXT DEFAULT NULL,
  content_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
  campaign_id UUID,
  campaign_type TEXT,
  ad_title TEXT,
  ad_description TEXT,
  ad_images JSONB,
  ad_url TEXT,
  ad_call_to_action TEXT,
  service_data JSONB,
  marketplace_data JSONB,
  business_data JSONB,
  community_post_data JSONB,
  event_data JSONB,
  priority_level INTEGER,
  daily_budget DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.id,
    ac.campaign_type,
    ac.ad_title,
    ac.ad_description,
    ac.ad_images,
    ac.ad_url,
    ac.ad_call_to_action,
    CASE WHEN ac.service_id IS NOT NULL THEN
      jsonb_build_object(
        'id', s.id,
        'title', s.title,
        'description', s.description,
        'price', s.price,
        'images', s.images
      )
    ELSE NULL END,
    CASE WHEN ac.marketplace_item_id IS NOT NULL THEN
      jsonb_build_object(
        'id', mi.id,
        'title', mi.title,
        'description', mi.description,
        'price', mi.price,
        'images', mi.images
      )
    ELSE NULL END,
    CASE WHEN ac.business_id IS NOT NULL THEN
      jsonb_build_object(
        'id', b.id,
        'name', b.business_name,
        'description', b.description,
        'logo_url', b.logo_url
      )
    ELSE NULL END,
    CASE WHEN ac.community_post_id IS NOT NULL THEN
      jsonb_build_object(
        'id', cp.id,
        'title', cp.title,
        'content', cp.content,
        'image_urls', cp.image_urls
      )
    ELSE NULL END,
    CASE WHEN ac.community_post_id IS NOT NULL THEN
      jsonb_build_object(
        'id', cp.id,
        'title', cp.title,
        'content', cp.content
      )
    ELSE NULL END,
    apt.priority_level,
    ac.daily_budget
  FROM public.advertisement_campaigns ac
  JOIN public.ad_pricing_tiers apt ON ac.pricing_tier_id = apt.id
  LEFT JOIN public.services s ON ac.service_id = s.id
  LEFT JOIN public.marketplace_items mi ON ac.marketplace_item_id = mi.id
  LEFT JOIN public.businesses b ON ac.business_id = b.id
  LEFT JOIN public.community_posts cp ON ac.community_post_id = cp.id
  WHERE ac.status = 'active'
    AND ac.approval_status = 'approved'
    AND ac.start_date <= now()
    AND ac.end_date >= now()
    AND ac.total_spent < ac.total_budget
    AND (
      (ac.target_geographic_scope = 'nationwide') OR
      (ac.target_geographic_scope = 'state' AND user_state = ANY(ac.target_states)) OR
      (ac.target_geographic_scope = 'city' AND user_city = ANY(ac.target_cities))
    )
  ORDER BY apt.priority_level DESC, RANDOM()
  LIMIT content_limit;
END;
$$;

-- Create function to log ad interactions
CREATE OR REPLACE FUNCTION public.log_ad_interaction(
  _campaign_id UUID,
  _interaction_type TEXT,
  _user_id UUID DEFAULT NULL,
  _user_location TEXT DEFAULT NULL,
  _device_type TEXT DEFAULT NULL,
  _referrer TEXT DEFAULT NULL,
  _ip_address INET DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ad_interactions (
    campaign_id,
    user_id,
    interaction_type,
    user_location,
    device_type,
    referrer,
    ip_address,
    user_agent
  ) VALUES (
    _campaign_id,
    _user_id,
    _interaction_type,
    _user_location,
    _device_type,
    _referrer,
    _ip_address,
    _user_agent
  );
  
  -- Update campaign statistics
  IF _interaction_type = 'impression' THEN
    UPDATE public.advertisement_campaigns
    SET total_impressions = total_impressions + 1
    WHERE id = _campaign_id;
  ELSIF _interaction_type = 'click' THEN
    UPDATE public.advertisement_campaigns
    SET total_clicks = total_clicks + 1
    WHERE id = _campaign_id;
  END IF;
END;
$$;