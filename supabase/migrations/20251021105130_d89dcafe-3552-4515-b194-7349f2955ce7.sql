-- Phase 4: Normalize existing location data in community_posts and profiles

-- Normalize cities in community_posts
UPDATE community_posts 
SET target_city = 'Kosofe'
WHERE target_city IN ('Ojota', 'Ogudu', 'ojota', 'ogudu', 'kosofe');

-- Normalize neighborhoods in community_posts for Kosofe area
UPDATE community_posts
SET target_neighborhood = 'Ojota'
WHERE target_city = 'Kosofe' 
AND target_neighborhood IN ('Ojota Central', 'Ojota/Ogudu', 'ojota central', 'ojota/ogudu', 'ojota');

UPDATE community_posts
SET target_neighborhood = 'Ogudu'
WHERE target_city = 'Kosofe' 
AND target_neighborhood IN ('ogudu', 'Ogudu GRA', 'ogudu gra');

-- Normalize cities in profiles
UPDATE profiles
SET city = 'Kosofe'
WHERE city IN ('Ojota', 'Ogudu', 'ojota', 'ogudu', 'kosofe');

-- Normalize neighborhoods in profiles for Kosofe area
UPDATE profiles
SET neighborhood = 'Ojota'
WHERE city = 'Kosofe'
AND neighborhood IN ('Ojota Central', 'Ojota/Ogudu', 'ojota central', 'ojota/ogudu', 'ojota');

UPDATE profiles
SET neighborhood = 'Ogudu'
WHERE city = 'Kosofe'
AND neighborhood IN ('ogudu', 'Ogudu GRA', 'ogudu gra');

-- Add more normalization as patterns emerge in your data
-- You can query for variations with:
-- SELECT DISTINCT target_city, target_neighborhood FROM community_posts WHERE target_state = 'Lagos';
-- SELECT DISTINCT city, neighborhood FROM profiles WHERE state = 'Lagos';