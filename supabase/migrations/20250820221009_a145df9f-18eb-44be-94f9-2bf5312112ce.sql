-- Create RLS policies to allow public viewing of active promotional content

-- Allow all authenticated users to view active promoted posts
CREATE POLICY "All users can view active promoted posts" 
ON public.promoted_posts 
FOR SELECT 
USING (
  is_active = true AND 
  EXISTS (
    SELECT 1 FROM promotion_campaigns pc 
    WHERE pc.id = promoted_posts.campaign_id 
    AND pc.status = 'active'
    AND pc.start_date <= now()
    AND pc.end_date >= now()
  )
);

-- Allow all authenticated users to view active promotion campaigns for display
CREATE POLICY "All users can view active promotion campaigns" 
ON public.promotion_campaigns 
FOR SELECT 
USING (
  status = 'active' AND 
  start_date <= now() AND 
  end_date >= now()
);

-- Create function to get active promoted content
CREATE OR REPLACE FUNCTION public.get_active_promoted_content(
  user_location text DEFAULT NULL,
  content_limit integer DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  images jsonb,
  category text,
  location text,
  price text,
  url text,
  sponsored boolean,
  time_posted text,
  business jsonb,
  cta text,
  likes integer,
  comments integer,
  type text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.id,
    COALESCE((pp.post_content->>'title')::text, 'Advertisement') as title,
    COALESCE((pp.post_content->>'description')::text, '') as description,
    COALESCE(pp.images, '[]'::jsonb) as images,
    COALESCE((pp.post_content->>'category')::text, 'general') as category,
    COALESCE(pf.neighborhood, pf.city, 'Location not specified') as location,
    COALESCE('₦' || (pp.post_content->>'price')::text, '') as price,
    COALESCE(pc.target_locations::text, '') as url,
    true as sponsored,
    CASE 
      WHEN EXTRACT(EPOCH FROM (NOW() - pp.created_at)) < 3600 THEN 'Just now'
      WHEN EXTRACT(EPOCH FROM (NOW() - pp.created_at)) < 86400 THEN 
        EXTRACT(HOUR FROM (NOW() - pp.created_at))::text || 'h ago'
      ELSE 
        EXTRACT(DAY FROM (NOW() - pp.created_at))::text || 'd ago'
    END as time_posted,
    jsonb_build_object(
      'name', COALESCE(pf.full_name, 'Business'),
      'logo', pf.avatar_url,
      'location', COALESCE(pf.city || ', ' || pf.state, 'Location not specified'),
      'verified', false
    ) as business,
    'Learn More' as cta,
    0 as likes,
    0 as comments,
    COALESCE(pp.post_type, 'general') as type
  FROM promoted_posts pp
  JOIN promotion_campaigns pc ON pp.campaign_id = pc.id
  LEFT JOIN profiles pf ON pc.user_id = pf.user_id
  WHERE pp.is_active = true
    AND pc.status = 'active'
    AND pc.start_date <= now()
    AND pc.end_date >= now()
  ORDER BY pp.priority DESC, pp.created_at DESC
  LIMIT content_limit;
END;
$$;