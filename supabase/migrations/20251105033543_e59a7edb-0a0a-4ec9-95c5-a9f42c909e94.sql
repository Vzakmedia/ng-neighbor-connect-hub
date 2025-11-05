-- Fix get_active_ads RPC function - remove the duplicate version and fix the one with s.name error
-- The error is "s.name" which should be "s.title" since services table has "title" column, not "name"

CREATE OR REPLACE FUNCTION get_active_ads(
  p_limit INT DEFAULT 5,
  user_state TEXT DEFAULT NULL,
  user_city TEXT DEFAULT NULL
)
RETURNS TABLE (
  campaign_id UUID,
  ad_title TEXT,
  ad_description TEXT,
  ad_images TEXT[],
  ad_url TEXT,
  ad_call_to_action TEXT,
  campaign_type TEXT,
  priority_level INT,
  service_name TEXT,
  service_price NUMERIC,
  marketplace_title TEXT,
  marketplace_price NUMERIC,
  business_name TEXT,
  business_logo TEXT,
  event_title TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
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
    s.title as service_name,  -- FIXED: changed from s.name to s.title
    CASE 
      WHEN s.price_min IS NOT NULL AND s.price_max IS NOT NULL 
      THEN (s.price_min + s.price_max) / 2
      WHEN s.price_min IS NOT NULL 
      THEN s.price_min
      ELSE NULL
    END as service_price,
    mi.title as marketplace_title,
    mi.price as marketplace_price,
    b.business_name,
    b.logo_url as business_logo,
    e.title as event_title,
    e.start_date as event_date,  -- FIXED: changed from e.event_date to e.start_date
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
  LIMIT p_limit;
END;
$$;