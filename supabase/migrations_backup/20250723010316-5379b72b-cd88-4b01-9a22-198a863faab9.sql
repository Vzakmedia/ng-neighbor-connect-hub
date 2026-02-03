-- Drop and recreate the function with a different parameter name to fix the ambiguous column reference
DROP FUNCTION IF EXISTS public.user_allows_direct_messages(uuid);

CREATE OR REPLACE FUNCTION public.user_allows_direct_messages(target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    allows_messages BOOLEAN;
BEGIN
    SELECT 
        COALESCE(mp.allow_messages, true) INTO allows_messages
    FROM 
        auth.users u
    LEFT JOIN 
        public.messaging_preferences mp ON u.id = mp.user_id
    WHERE 
        u.id = target_user_id;
    
    RETURN allows_messages;
END;
$function$;