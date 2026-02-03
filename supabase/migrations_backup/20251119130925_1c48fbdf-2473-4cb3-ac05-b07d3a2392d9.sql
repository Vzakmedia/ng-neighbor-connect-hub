-- Fix get_active_ads function by setting search_path for security
DROP FUNCTION IF EXISTS public.get_active_ads(INT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_active_ads(
  p_limit INT DEFAULT 10,
  user_state TEXT DEFAULT NULL,
  user_city TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  campaign_id UUID,
  campaign_name TEXT,
  campaign_type TEXT,
  ad_title TEXT,
  ad_description TEXT,
  ad_images JSONB,
  ad_url TEXT,
  ad_call_to_action TEXT,
  priority_level INT,
  target_geographic_scope TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.id,
    ac.id as campaign_id,
    ac.campaign_name,
    ac.campaign_type,
    ac.ad_title,
    ac.ad_description,
    ac.ad_images,
    ac.ad_url,
    ac.ad_call_to_action,
    ac.priority_level,
    ac.target_geographic_scope
  FROM 
    advertisement_campaigns ac
  WHERE 
    ac.status = 'active'
    AND ac.approval_status = 'approved'
    AND (ac.payment_status = 'completed' OR ac.payment_status = 'paid')
    AND ac.start_date <= NOW()
    AND ac.end_date >= NOW()
    AND (
      -- Match geographic scope
      CASE 
        WHEN ac.target_geographic_scope = 'national' THEN TRUE
        WHEN ac.target_geographic_scope = 'state' AND user_state IS NOT NULL THEN 
          user_state = ANY(ac.target_states)
        WHEN ac.target_geographic_scope = 'city' AND user_city IS NOT NULL AND user_state IS NOT NULL THEN 
          user_city = ANY(ac.target_cities) AND user_state = ANY(ac.target_states)
        ELSE FALSE
      END
    )
  ORDER BY 
    ac.priority_level DESC NULLS LAST,
    ac.created_at DESC
  LIMIT p_limit;
END;
$$;