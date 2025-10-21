-- Drop existing functions before recreating with updated signatures
DROP FUNCTION IF EXISTS public.get_active_promoted_content(TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.log_promotion_impression(UUID, UUID, TEXT, TEXT);

-- Fix get_active_promoted_content to query advertisement_campaigns instead of sponsored_content
CREATE OR REPLACE FUNCTION public.get_active_promoted_content(
  user_location TEXT DEFAULT NULL,
  content_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  images JSONB,
  category TEXT,
  location TEXT,
  price TEXT,
  url TEXT,
  sponsored BOOLEAN,
  time_posted TIMESTAMP WITH TIME ZONE,
  business JSONB,
  cta TEXT,
  likes INTEGER,
  comments INTEGER,
  type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.id,
    COALESCE(ac.ad_title, s.title, mi.title, cp.title, e.title, b.business_name) as title,
    COALESCE(ac.ad_description, s.description, mi.description, cp.content, e.description, b.description) as description,
    COALESCE(ac.ad_images, s.images, mi.images, cp.image_urls, e.image_urls, jsonb_build_array(b.logo_url)) as images,
    COALESCE(s.category, mi.category, 'general') as category,
    COALESCE(s.location, mi.location, cp.location, e.location, b.city) as location,
    CASE 
      WHEN s.price_min IS NOT NULL AND s.price_max IS NOT NULL THEN 
        '₦' || s.price_min::TEXT || ' - ₦' || s.price_max::TEXT
      WHEN s.price_min IS NOT NULL THEN 
        'From ₦' || s.price_min::TEXT
      WHEN mi.price IS NOT NULL THEN 
        '₦' || mi.price::TEXT
      ELSE NULL
    END as price,
    COALESCE(ac.ad_url, '/services/' || s.id::TEXT, '/marketplace/' || mi.id::TEXT) as url,
    TRUE as sponsored,
    ac.created_at as time_posted,
    CASE WHEN b.id IS NOT NULL THEN
      jsonb_build_object(
        'name', b.business_name,
        'logo', b.logo_url,
        'location', b.city,
        'verified', b.verification_status = 'verified'
      )
    ELSE
      jsonb_build_object(
        'name', 'Sponsored',
        'location', COALESCE(s.location, mi.location, 'Nigeria'),
        'verified', false
      )
    END as business,
    COALESCE(ac.ad_call_to_action, 'Learn More') as cta,
    0 as likes,
    0 as comments,
    ac.campaign_type as type
  FROM public.advertisement_campaigns ac
  JOIN public.ad_pricing_tiers apt ON ac.pricing_tier_id = apt.id
  LEFT JOIN public.services s ON ac.service_id = s.id
  LEFT JOIN public.marketplace_items mi ON ac.marketplace_item_id = mi.id
  LEFT JOIN public.businesses b ON ac.business_id = b.id
  LEFT JOIN public.community_posts cp ON ac.community_post_id = cp.id
  LEFT JOIN public.events e ON ac.event_id = e.id
  WHERE ac.status = 'active'
    AND ac.approval_status = 'approved'
    AND ac.payment_status = 'completed'
    AND ac.start_date <= now()
    AND ac.end_date >= now()
    AND ac.total_spent < ac.total_budget
  ORDER BY apt.priority_level DESC, RANDOM()
  LIMIT content_limit;
END;
$$;

-- Fix log_promotion_impression to insert into ad_interactions instead of promotion_impressions
CREATE OR REPLACE FUNCTION public.log_promotion_impression(
  _promoted_post_id UUID,
  _user_id UUID DEFAULT NULL,
  _user_location TEXT DEFAULT NULL,
  _impression_type TEXT DEFAULT 'view'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into ad_interactions table (new system)
  INSERT INTO public.ad_interactions (
    campaign_id,
    user_id,
    interaction_type,
    user_location,
    device_type,
    created_at
  )
  VALUES (
    _promoted_post_id,
    _user_id,
    CASE 
      WHEN _impression_type = 'view' THEN 'impression'
      WHEN _impression_type = 'click' THEN 'click'
      ELSE 'impression'
    END,
    _user_location,
    'web',
    now()
  );

  -- Update campaign stats
  IF _impression_type = 'view' THEN
    UPDATE public.advertisement_campaigns
    SET total_impressions = total_impressions + 1
    WHERE id = _promoted_post_id;
  ELSIF _impression_type = 'click' THEN
    UPDATE public.advertisement_campaigns
    SET total_clicks = total_clicks + 1
    WHERE id = _promoted_post_id;
  END IF;
END;
$$;