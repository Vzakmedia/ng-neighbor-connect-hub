-- Migrate existing neighborhood data to the new neighbourhood column
UPDATE public.profiles 
SET neighbourhood = neighborhood 
WHERE neighbourhood IS NULL AND neighborhood IS NOT NULL;

-- Update existing community posts to populate location data from profiles
UPDATE public.community_posts 
SET 
  target_neighborhood = p.neighbourhood,
  target_city = p.city,
  target_state = p.state,
  location_scope = CASE 
    WHEN p.neighbourhood IS NOT NULL THEN 'neighbourhood'::location_scope
    WHEN p.city IS NOT NULL THEN 'city'::location_scope  
    WHEN p.state IS NOT NULL THEN 'state'::location_scope
    ELSE 'all'::location_scope
  END
FROM public.profiles p
WHERE community_posts.user_id = p.user_id 
  AND community_posts.location_scope IS NULL;