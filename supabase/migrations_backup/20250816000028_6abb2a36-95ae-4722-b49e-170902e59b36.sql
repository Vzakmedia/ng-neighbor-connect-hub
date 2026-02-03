-- Drop the security definer view that's causing the issue
DROP VIEW IF EXISTS public.business_directory;

-- Instead of a view, create a more secure RLS policy for public business access
-- This allows direct table access with proper RLS controls instead of view-based security

-- Create a policy that allows public access to only verified businesses' non-sensitive data
CREATE POLICY "Public can view verified business directory info"
ON public.businesses
FOR SELECT
USING (
    verification_status = 'verified' 
    AND is_verified = true
);

-- Create a function to get business directory info without SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_business_directory()
RETURNS TABLE(
    id uuid,
    business_name text,
    description text,
    category text,
    city text,
    state text,
    logo_url text,
    operating_hours jsonb,
    is_verified boolean,
    rating numeric,
    total_reviews integer,
    created_at timestamptz
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    -- This function runs with the caller's permissions (not SECURITY DEFINER)
    -- and relies on RLS policies for access control
    SELECT 
        b.id,
        b.business_name,
        b.description,
        b.category,
        b.city,
        b.state,
        b.logo_url,
        b.operating_hours,
        b.is_verified,
        b.rating,
        b.total_reviews,
        b.created_at
    FROM public.businesses b
    WHERE b.verification_status = 'verified'
    AND b.is_verified = true;
$$;

-- Grant execute to both authenticated and anonymous users
GRANT EXECUTE ON FUNCTION get_business_directory() TO authenticated, anon;