-- Fix security warning: Set immutable search path for the function
DROP FUNCTION IF EXISTS public.get_location_filtered_posts(text, text, text, boolean, integer, integer);

CREATE OR REPLACE FUNCTION public.get_location_filtered_posts(
  user_neighborhood text DEFAULT NULL,
  user_city text DEFAULT NULL, 
  user_state text DEFAULT NULL,
  show_all_posts boolean DEFAULT false,
  post_limit integer DEFAULT 20,
  post_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  title text,
  content text,
  post_type text,
  location text,
  tags text[],
  image_urls text[],
  file_urls jsonb,
  rsvp_enabled boolean,
  location_scope location_scope,
  target_neighborhood text,
  target_city text,
  target_state text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF show_all_posts THEN
    -- Return all posts regardless of location
    RETURN QUERY
    SELECT 
      cp.id, cp.user_id, cp.title, cp.content, cp.post_type, cp.location, cp.tags,
      cp.image_urls, cp.file_urls, cp.rsvp_enabled, cp.location_scope,
      cp.target_neighborhood, cp.target_city, cp.target_state,
      cp.created_at, cp.updated_at
    FROM public.community_posts cp
    ORDER BY cp.created_at DESC
    LIMIT post_limit OFFSET post_offset;
  ELSE
    -- Filter posts based on user location
    RETURN QUERY
    SELECT 
      cp.id, cp.user_id, cp.title, cp.content, cp.post_type, cp.location, cp.tags,
      cp.image_urls, cp.file_urls, cp.rsvp_enabled, cp.location_scope,
      cp.target_neighborhood, cp.target_city, cp.target_state,
      cp.created_at, cp.updated_at
    FROM public.community_posts cp
    WHERE 
      cp.location_scope = 'all' OR
      (cp.location_scope = 'state' AND cp.target_state = user_state) OR
      (cp.location_scope = 'city' AND cp.target_city = user_city AND cp.target_state = user_state) OR
      (cp.location_scope = 'neighborhood' AND cp.target_neighborhood = user_neighborhood 
       AND cp.target_city = user_city AND cp.target_state = user_state)
    ORDER BY cp.created_at DESC
    LIMIT post_limit OFFSET post_offset;
  END IF;
END;
$function$;