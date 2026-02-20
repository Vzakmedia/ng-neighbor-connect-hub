-- Migration to fix post privacy in get_feed function
-- This ensures that users can ONLY see posts that are intended for their location scope
-- regardless of what filter they have selected.
CREATE OR REPLACE FUNCTION public.get_feed(
        target_user_id uuid,
        filter_level text DEFAULT 'neighborhood',
        limit_count int DEFAULT 20,
        cursor timestamptz DEFAULT NULL,
        min_created_at timestamptz DEFAULT NULL
    ) RETURNS TABLE(
        id uuid,
        user_id uuid,
        content text,
        title text,
        image_urls text [],
        tags text [],
        location text,
        location_scope text,
        target_neighborhood text,
        target_city text,
        target_state text,
        rsvp_enabled boolean,
        created_at timestamptz,
        updated_at timestamptz,
        author_name text,
        author_avatar text,
        likes_count bigint,
        comments_count bigint
    ) LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
DECLARE user_neighborhood text;
user_city text;
user_state text;
BEGIN -- Get user's profile information
SELECT p.neighborhood,
    p.city,
    p.state INTO user_neighborhood,
    user_city,
    user_state
FROM public.profiles p
WHERE p.user_id = target_user_id;
RETURN QUERY
SELECT cp.id,
    cp.user_id,
    cp.content,
    cp.title,
    cp.image_urls,
    cp.tags,
    cp.location,
    cp.location_scope,
    cp.target_neighborhood,
    cp.target_city,
    cp.target_state,
    cp.rsvp_enabled,
    cp.created_at,
    cp.updated_at,
    p.full_name as author_name,
    p.avatar_url as author_avatar,
    COALESCE(likes.count, 0) as likes_count,
    COALESCE(comments.count, 0) as comments_count
FROM public.community_posts cp
    JOIN public.profiles p ON cp.user_id = p.user_id
    LEFT JOIN (
        SELECT post_id,
            COUNT(*) as count
        FROM public.post_likes
        GROUP BY post_id
    ) likes ON cp.id = likes.post_id
    LEFT JOIN (
        SELECT post_id,
            COUNT(*) as count
        FROM public.post_comments
        GROUP BY post_id
    ) comments ON cp.id = comments.post_id
WHERE -- 1. Optimization: Apply cursor pagination first
    (
        cursor IS NULL
        OR cp.created_at < cursor
    )
    AND -- 2. New User Filter: Filter by minimum creation date if provided
    (
        min_created_at IS NULL
        OR cp.created_at >= min_created_at
    )
    AND -- 3. Scope Privacy Enforcement (The Fix)
    -- This condition ensures the user is ALLOWED to see the post based on the post's settings
    (
        -- Case A: Public Global Post
        cp.location_scope = 'all'
        OR -- Case B: State Only Post - User must match state
        (
            cp.location_scope = 'state'
            AND cp.target_state = user_state
        )
        OR -- Case C: City Only Post - User must match city AND state (for uniqueness)
        (
            cp.location_scope = 'city'
            AND cp.target_city = user_city
            AND cp.target_state = user_state
        )
        OR -- Case D: Neighborhood Only Post - User must match neighborhood AND city AND state
        (
            cp.location_scope = 'neighborhood'
            AND cp.target_neighborhood = user_neighborhood
            AND cp.target_city = user_city
            AND cp.target_state = user_state
        )
        OR -- Case E: Author always sees their own posts regardless of scope/location mismatches
        (cp.user_id = target_user_id)
    )
    AND -- 4. User Preference Filter (What the user requested to see)
    (
        (
            filter_level = 'neighborhood'
            AND cp.target_neighborhood = user_neighborhood
        )
        OR (
            filter_level = 'city'
            AND cp.target_city = user_city
        )
        OR (
            filter_level = 'state'
            AND cp.target_state = user_state
        )
        OR (
            filter_level NOT IN ('neighborhood', 'city', 'state')
        ) -- 'all' or default
    )
ORDER BY cp.created_at DESC
LIMIT limit_count;
END;
$$;