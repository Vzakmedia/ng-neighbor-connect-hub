-- Fix security issues by setting search_path on functions
-- Update existing functions to have proper search_path

CREATE OR REPLACE FUNCTION public.has_staff_permission(_user_id uuid, _permission text, _access_type text DEFAULT 'read'::text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.staff_permissions sp ON ur.role = sp.role
    WHERE ur.user_id = _user_id
      AND sp.permission_name = _permission
      AND (
        (_access_type = 'read' AND sp.can_read = true) OR
        (_access_type = 'write' AND sp.can_write = true) OR
        (_access_type = 'delete' AND sp.can_delete = true)
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.log_staff_activity(_action_type text, _resource_type text, _resource_id uuid DEFAULT NULL::uuid, _details jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.activity_logs (
        user_id,
        action_type,
        resource_type,
        resource_id,
        details
    ) VALUES (
        auth.uid(),
        _action_type,
        _resource_type,
        _resource_id,
        _details
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_staff_role(_user_id uuid DEFAULT NULL::uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = COALESCE(_user_id, auth.uid())
  AND role IN ('super_admin', 'moderator', 'manager', 'support', 'staff')
  LIMIT 1
$function$;