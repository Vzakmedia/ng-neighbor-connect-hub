-- Update existing community posts to populate location targeting fields properly
UPDATE public.community_posts 
SET 
  target_neighborhood = p.neighbourhood,
  target_city = p.city,
  target_state = p.state,
  location_scope = CASE 
    WHEN p.neighbourhood IS NOT NULL AND p.neighbourhood != '' THEN 'neighborhood'::location_scope
    WHEN p.city IS NOT NULL AND p.city != '' THEN 'city'::location_scope  
    WHEN p.state IS NOT NULL AND p.state != '' THEN 'state'::location_scope
    ELSE 'all'::location_scope
  END
FROM public.profiles p
WHERE community_posts.user_id = p.user_id 
  AND (community_posts.target_neighborhood IS NULL OR community_posts.location_scope = 'all');