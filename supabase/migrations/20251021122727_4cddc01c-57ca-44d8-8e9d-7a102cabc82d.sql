-- Fix get_active_advertisements function to use correct service pricing fields
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
        'price_min', s.price_min,
        'price_max', s.price_max,
        'price_type', s.price_type,
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
    CASE WHEN ac.event_id IS NOT NULL THEN
      jsonb_build_object(
        'id', e.id,
        'title', e.title,
        'description', e.description
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
  LEFT JOIN public.events e ON ac.event_id = e.id
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