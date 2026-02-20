-- Fix RLS policies for community_posts to enforce location privacy
-- 1. Drop the existing permissive policy
DROP POLICY IF EXISTS "Community posts are viewable by everyone" ON public.community_posts;
-- 2. Create strict policy based on location scope
CREATE POLICY "Community posts access policy" ON public.community_posts FOR
SELECT USING (
        -- Case 1: Author always sees their own posts
        (auth.uid() = user_id)
        OR -- Case 2: Global posts are visible to everyone
        (location_scope = 'all')
        OR -- Case 3: Scoped posts require location match
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.user_id = auth.uid()
                AND (
                    -- State scope matching
                    (
                        location_scope = 'state'
                        AND p.state = target_state
                    )
                    OR -- City scope matching
                    (
                        location_scope = 'city'
                        AND p.city = target_city
                        AND p.state = target_state
                    )
                    OR -- Neighborhood scope matching
                    (
                        location_scope = 'neighborhood'
                        AND p.neighborhood = target_neighborhood
                        AND p.city = target_city
                        AND p.state = target_state
                    )
                )
        )
    );