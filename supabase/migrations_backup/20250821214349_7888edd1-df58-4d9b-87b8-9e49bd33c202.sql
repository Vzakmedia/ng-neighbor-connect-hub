-- Update existing posts to have location scope data based on user profiles
UPDATE public.community_posts 
SET 
  location_scope = 'all',
  target_neighborhood = NULL,
  target_city = NULL,
  target_state = NULL
WHERE location_scope IS NULL;

-- Add function to debug post filtering
CREATE OR REPLACE FUNCTION public.debug_posts_for_user(_user_id uuid)
RETURNS TABLE(
  post_id uuid,
  post_location_scope location_scope,
  post_target_neighborhood text,
  post_target_city text,
  post_target_state text,
  user_neighborhood text,
  user_city text,
  user_state text,
  should_show_neighborhood boolean,
  should_show_city boolean,
  should_show_state boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.location_scope,
    cp.target_neighborhood,
    cp.target_city,
    cp.target_state,
    p.neighborhood,
    p.city,
    p.state,
    -- Check if should show for neighborhood filter
    (cp.location_scope = 'neighborhood' 
     AND cp.target_neighborhood = p.neighborhood 
     AND cp.target_city = p.city 
     AND cp.target_state = p.state) as should_show_neighborhood,
    -- Check if should show for city filter  
    (cp.location_scope = 'city' 
     AND cp.target_city = p.city 
     AND cp.target_state = p.state) as should_show_city,
    -- Check if should show for state filter
    (cp.location_scope = 'state' 
     AND cp.target_state = p.state) as should_show_state
  FROM public.community_posts cp
  CROSS JOIN public.profiles p
  WHERE p.user_id = _user_id
  ORDER BY cp.created_at DESC
  LIMIT 10;
END;
$function$;