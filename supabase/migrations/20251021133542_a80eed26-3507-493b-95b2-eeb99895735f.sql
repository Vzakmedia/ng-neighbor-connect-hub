-- Fix discussion_boards foreign key to profiles
ALTER TABLE discussion_boards 
ADD CONSTRAINT discussion_boards_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Drop and recreate the get_active_ads function with correct column names
DROP FUNCTION IF EXISTS get_active_ads(p_user_location jsonb, p_limit integer);

CREATE OR REPLACE FUNCTION get_active_ads(
  p_user_location jsonb DEFAULT NULL,
  p_limit integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ac.id,
      'campaign_name', ac.campaign_name,
      'campaign_type', ac.campaign_type,
      'ad_title', ac.ad_title,
      'ad_description', ac.ad_description,
      'ad_images', ac.ad_images,
      'ad_url', ac.ad_url,
      'ad_call_to_action', ac.ad_call_to_action,
      'business_id', ac.business_id,
      'service_id', ac.service_id,
      'marketplace_item_id', ac.marketplace_item_id,
      'community_post_id', ac.community_post_id,
      'event_id', ac.event_id,
      'business_name', b.business_name,
      'business_logo', b.logo_url,
      'service_title', s.title,
      'service_price', CASE 
        WHEN s.price_min IS NOT NULL AND s.price_max IS NOT NULL 
        THEN CONCAT('₦', s.price_min::text, ' - ₦', s.price_max::text)
        WHEN s.price_min IS NOT NULL 
        THEN CONCAT('₦', s.price_min::text)
        ELSE NULL
      END,
      'item_name', mi.title,
      'item_price', mi.price,
      'item_image', mi.image_url,
      'post_content', cp.content,
      'event_title', e.title,
      'event_date', e.start_date,
      'priority_level', ac.priority_level
    )
  )
  INTO v_result
  FROM advertisement_campaigns ac
  LEFT JOIN businesses b ON ac.business_id = b.id
  LEFT JOIN services s ON ac.service_id = s.id
  LEFT JOIN marketplace_items mi ON ac.marketplace_item_id = mi.id
  LEFT JOIN community_posts cp ON ac.community_post_id = cp.id
  LEFT JOIN events e ON ac.event_id = e.id
  WHERE ac.status = 'active'
    AND ac.approval_status = 'approved'
    AND ac.start_date <= NOW()
    AND ac.end_date >= NOW()
    AND ac.total_impressions < (
      SELECT COALESCE(impressions_included, 1000)
      FROM ad_pricing_tiers
      WHERE id = ac.pricing_tier_id
    )
  ORDER BY ac.priority_level DESC, RANDOM()
  LIMIT p_limit;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;