-- Add unique staff ID number to profiles table
ALTER TABLE public.profiles 
ADD COLUMN staff_id SERIAL UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_profiles_staff_id ON public.profiles(staff_id);

-- Update RLS policies for profile access
DROP POLICY IF EXISTS "Super admins and support can view all profiles" ON public.profiles;

-- Allow super admin and support staff to view all user profiles
CREATE POLICY "Super admins and support can view all profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'support'::app_role)
);

-- Allow super admin and support to update profiles when needed
CREATE POLICY "Super admins and support can update profiles"
ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'support'::app_role)
);

-- Add function to get profile by staff ID for staff use
CREATE OR REPLACE FUNCTION public.get_profile_by_staff_id(target_staff_id integer)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  email text,
  phone text,
  city text,
  state text,
  neighborhood text,
  staff_id integer,
  created_at timestamp with time zone,
  is_verified boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow super admin and support staff
  IF NOT (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'support'::app_role)) THEN
    RAISE EXCEPTION 'Insufficient permissions to access user profiles';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    p.email,
    p.phone,
    p.city,
    p.state,
    p.neighborhood,
    p.staff_id,
    p.created_at,
    p.is_verified
  FROM public.profiles p
  WHERE p.staff_id = target_staff_id;
END;
$$;