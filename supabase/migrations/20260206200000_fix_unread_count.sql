CREATE OR REPLACE FUNCTION public.get_unread_community_posts_count() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
DECLARE unread_count integer;
user_created_at timestamptz;
BEGIN -- Get user creation time to avoid showing unread posts from before they joined
SELECT created_at INTO user_created_at
FROM auth.users
WHERE id = auth.uid();
SELECT COUNT(*)::integer INTO unread_count
FROM public.community_posts cp
WHERE cp.created_at >= user_created_at
    AND cp.user_id != auth.uid() -- Don't count own posts
    AND NOT EXISTS (
        SELECT 1
        FROM public.post_read_status prs
        WHERE prs.user_id = auth.uid()
            AND prs.post_id = cp.id
    );
RETURN COALESCE(unread_count, 0);
END;
$$;