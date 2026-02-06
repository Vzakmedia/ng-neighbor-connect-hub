CREATE OR REPLACE FUNCTION public.get_unread_board_posts_count() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
DECLARE unread_count integer;
BEGIN
SELECT COUNT(*)::integer INTO unread_count
FROM public.board_posts bp
    JOIN public.board_members bm ON bp.board_id = bm.board_id
WHERE bm.user_id = auth.uid()
    AND (
        bm.status = 'active'
        OR bm.role IN ('admin', 'moderator')
    )
    AND bp.created_at >= bm.created_at -- Users only see posts created after they joined
    AND bp.user_id != auth.uid() -- Don't count own posts
    AND NOT EXISTS (
        SELECT 1
        FROM public.board_post_read_status prs
        WHERE prs.user_id = auth.uid()
            AND prs.post_id = bp.id
    );
RETURN COALESCE(unread_count, 0);
END;
$$;