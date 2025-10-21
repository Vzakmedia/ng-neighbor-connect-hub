-- Fix e.description error in get_active_promoted_content function
DROP FUNCTION IF EXISTS public.get_active_promoted_content(text, integer);

CREATE OR REPLACE FUNCTION public.get_active_promoted_content(
  user_location text DEFAULT NULL,
  content_limit integer DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  campaign_id uuid,
  title text,
  description text,
  images text[],
  price text,
  category text,
  cta_text text,
  cta_url text,
  business jsonb,
  placement text,
  priority integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(s.id, m.id, e.id, b.id) as id,
    ac.id as campaign_id,
    COALESCE(s.title, m.title, e.title, b.business_name) as title,
    COALESCE(s.description, m.description, e.content, b.description) as description,
    COALESCE(s.image_urls, m.image_urls, e.image_urls, ARRAY[b.logo_url]) as images,
    CASE 
      WHEN s.price_min IS NOT NULL AND s.price_max IS NOT NULL THEN 
        '₦' || s.price_min::text || ' - ₦' || s.price_max::text
      WHEN s.price_min IS NOT NULL THEN 
        'From ₦' || s.price_min::text
      WHEN s.price IS NOT NULL THEN 
        '₦' || s.price::text
      WHEN m.price IS NOT NULL THEN 
        '₦' || m.price::text
      ELSE NULL
    END as price,
    COALESCE(s.category, m.category, 'Event', 'Business') as category,
    COALESCE(ac.cta_text, 'Learn More') as cta_text,
    COALESCE(ac.cta_url, '#') as cta_url,
    jsonb_build_object(
      'id', b.id,
      'name', b.business_name,
      'logo', b.logo_url,
      'verified', b.verified,
      'location', b.location
    ) as business,
    ac.placement,
    ac.priority
  FROM public.advertisement_campaigns ac
  LEFT JOIN public.services s ON ac.service_id = s.id
  LEFT JOIN public.marketplace_items m ON ac.marketplace_item_id = m.id
  LEFT JOIN public.events e ON ac.event_id = e.id
  LEFT JOIN public.business_profiles b ON ac.business_id = b.id
  WHERE ac.status = 'active'
    AND ac.start_date <= NOW()
    AND (ac.end_date IS NULL OR ac.end_date >= NOW())
    AND (user_location IS NULL OR b.location ILIKE '%' || user_location || '%')
  ORDER BY ac.priority DESC, ac.created_at DESC
  LIMIT content_limit;
END;
$$;