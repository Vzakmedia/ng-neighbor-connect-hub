-- Fix target_city for neighborhood posts by using the poster's profile city
-- This addresses data inconsistency where neighborhood posts had incorrect target_city values

UPDATE community_posts cp
SET target_city = p.city
FROM profiles p
WHERE cp.user_id = p.user_id
  AND cp.location_scope = 'neighborhood'
  AND cp.target_city IS NOT NULL
  AND cp.target_city != p.city;