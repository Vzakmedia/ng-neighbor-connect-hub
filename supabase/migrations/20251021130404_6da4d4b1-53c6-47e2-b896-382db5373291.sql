-- Unified Advertisement System Migration (Final Fixed Version)
-- Adds priority_level and creates the get_active_ads RPC function

-- Step 1: Add priority_level to advertisement_campaigns if not exists
ALTER TABLE advertisement_campaigns 
ADD COLUMN IF NOT EXISTS priority_level INTEGER DEFAULT 1;

-- Step 2: Create unified RPC function for getting active ads
CREATE OR REPLACE FUNCTION get_active_ads(
  user_location TEXT DEFAULT NULL,
  user_city TEXT DEFAULT NULL,
  user_state TEXT DEFAULT NULL,
  content_limit INT DEFAULT 5
)
RETURNS TABLE (
  campaign_id UUID,
  ad_title TEXT,
  ad_description TEXT,
  ad_images JSONB,
  ad_url TEXT,
  ad_call_to_action TEXT,
  campaign_type TEXT,
  priority_level INTEGER,
  service_name TEXT,
  service_price TEXT,
  marketplace_title TEXT,
  marketplace_price NUMERIC,
  business_name TEXT,
  business_logo TEXT,
  event_title TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.id as campaign_id,
    ac.ad_title,
    ac.ad_description,
    ac.ad_images,
    ac.ad_url,
    ac.ad_call_to_action,
    ac.campaign_type,
    COALESCE(ac.priority_level, 1) as priority_level,
    s.name as service_name,
    s.price as service_price,
    mi.title as marketplace_title,
    mi.price as marketplace_price,
    b.business_name,
    b.logo_url as business_logo,
    e.title as event_title,
    e.event_date,
    COALESCE(
      s.location,
      mi.location,
      b.physical_address,
      e.location,
      ac.target_states::text
    ) as location,
    ac.created_at
  FROM advertisement_campaigns ac
  LEFT JOIN services s ON ac.service_id = s.id
  LEFT JOIN marketplace_items mi ON ac.marketplace_item_id = mi.id
  LEFT JOIN businesses b ON ac.business_id = b.id
  LEFT JOIN events e ON ac.event_id = e.id
  WHERE ac.status = 'active'
    AND ac.approval_status = 'approved'
    AND ac.payment_status = 'completed'
    AND ac.start_date <= NOW()
    AND ac.end_date >= NOW()
    AND COALESCE(ac.total_spent, 0) < ac.total_budget
    AND (
      user_state IS NULL 
      OR ac.target_geographic_scope = 'nationwide'
      OR (ac.target_geographic_scope = 'state' AND user_state = ANY(ac.target_states))
      OR (ac.target_geographic_scope = 'city' AND user_city = ANY(ac.target_cities))
    )
  ORDER BY COALESCE(ac.priority_level, 1) DESC, ac.created_at DESC
  LIMIT content_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create function to calculate campaign cost
CREATE OR REPLACE FUNCTION calculate_campaign_cost(
  pricing_tier_id UUID,
  duration_days INT
)
RETURNS NUMERIC AS $$
DECLARE
  tier_price NUMERIC;
  tier_scope TEXT;
  base_cost NUMERIC;
BEGIN
  SELECT base_price_per_day, geographic_scope INTO tier_price, tier_scope
  FROM ad_pricing_tiers
  WHERE id = pricing_tier_id AND is_active = true;
  
  IF tier_price IS NULL THEN
    RAISE EXCEPTION 'Invalid pricing tier';
  END IF;
  
  base_cost := tier_price * duration_days;
  
  -- Apply scope multipliers
  CASE tier_scope
    WHEN 'nationwide' THEN base_cost := base_cost * 3;
    WHEN 'state' THEN base_cost := base_cost * 2;
    ELSE base_cost := base_cost * 1;
  END CASE;
  
  RETURN base_cost;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status_dates 
ON advertisement_campaigns(status, start_date, end_date) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_geographic 
ON advertisement_campaigns(target_geographic_scope, target_states, target_cities);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_type 
ON advertisement_campaigns(campaign_type);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_priority
ON advertisement_campaigns(priority_level DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ad_interactions_campaign 
ON ad_interactions(campaign_id, interaction_type, created_at);