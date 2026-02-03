-- Fix potential issues with promotional queries by ensuring proper column references
-- This addresses the "column s.price does not exist" errors in the logs

-- Update the get_active_promoted_content function to fix column references
CREATE OR REPLACE FUNCTION public.get_active_promoted_content(
    user_location text DEFAULT NULL::text,
    content_limit integer DEFAULT 5
)
RETURNS TABLE(
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.title,
    sc.description,
    sc.images,
    sc.category,
    COALESCE(sc.location, 'Local Area') as location,
    COALESCE(sc.price_display, '') as price,
    sc.url,
    true as sponsored,
    'Recently' as time_posted,
    jsonb_build_object(
      'name', COALESCE(sc.business_name, 'Local Business'),
      'location', COALESCE(sc.location, 'Local Area'),
      'verified', false
    ) as business,
    COALESCE(sc.call_to_action, 'Learn More') as cta,
    0 as likes,
    0 as comments,
    COALESCE(sc.content_type, 'general') as type
  FROM public.sponsored_content sc
  WHERE sc.status = 'active'
    AND sc.start_date <= now()
    AND sc.end_date >= now()
  ORDER BY sc.priority DESC, sc.created_at DESC
  LIMIT content_limit;
END;
$function$;