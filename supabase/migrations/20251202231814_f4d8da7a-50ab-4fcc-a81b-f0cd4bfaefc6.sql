-- Fix privilege escalation in user_roles RLS policies
-- Drop vulnerable policies that allow any admin to manage all roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

-- Create helper function to get admin level (returns highest privilege level)
CREATE OR REPLACE FUNCTION public.get_admin_level(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM public.user_roles WHERE user_id = _user_id AND role IN ('super_admin', 'admin') ORDER BY CASE role WHEN 'super_admin' THEN 1 WHEN 'admin' THEN 2 END LIMIT 1),
    'none'
  )
$$;

-- Create function to check if current user can modify a specific role
CREATE OR REPLACE FUNCTION public.can_admin_modify_role(_target_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    -- Super admins can modify all roles
    WHEN public.get_admin_level(auth.uid()) = 'super_admin' THEN true
    -- Regular admins can only modify non-admin roles
    WHEN public.get_admin_level(auth.uid()) = 'admin' AND _target_role NOT IN ('admin', 'super_admin') THEN true
    ELSE false
  END
$$;

-- Create secure RLS policies for user_roles
-- Policy: Users can view their own role
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Admins can view all roles for user management
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Policy: Super admins can insert any role
CREATE POLICY "Super admins can insert any role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Policy: Admins can insert non-admin roles
CREATE POLICY "Admins can insert non-admin roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') 
  AND role::text NOT IN ('admin', 'super_admin')
);

-- Policy: Super admins can update any role
CREATE POLICY "Super admins can update any role"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Policy: Admins can update non-admin roles only
CREATE POLICY "Admins can update non-admin roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') 
  AND role::text NOT IN ('admin', 'super_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') 
  AND role::text NOT IN ('admin', 'super_admin')
);

-- Policy: Super admins can delete any role
CREATE POLICY "Super admins can delete any role"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Policy: Admins can delete non-admin roles only
CREATE POLICY "Admins can delete non-admin roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') 
  AND role::text NOT IN ('admin', 'super_admin')
);

-- Fix search_path for existing has_role function if it exists
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;