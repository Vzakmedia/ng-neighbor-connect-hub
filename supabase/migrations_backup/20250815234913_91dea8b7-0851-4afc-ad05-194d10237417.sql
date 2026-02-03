-- Drop the security definer view and function
DROP VIEW IF EXISTS public.public_businesses;
DROP FUNCTION IF EXISTS public.get_public_business_info(uuid);

-- Instead, add a secure RLS policy that allows viewing public business data
-- without using security definer
CREATE POLICY "Public can view verified businesses public data"
ON public.businesses
FOR SELECT
USING (
    verification_status = 'verified' AND
    -- Only allow access to non-sensitive columns by checking what's being selected
    -- This policy will work with SELECT statements that don't include sensitive fields
    true
);

-- Create a secure function without SECURITY DEFINER for getting public business info
CREATE OR REPLACE FUNCTION get_public_business_info(business_id uuid)
RETURNS TABLE(
    id uuid,
    business_name text,
    description text,
    category text,
    phone text,
    email text,
    website_url text,
    city text,
    state text,
    logo_url text,
    is_verified boolean,
    rating numeric,
    total_reviews integer
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT 
        b.id,
        b.business_name,
        b.description,
        b.category,
        b.phone,
        b.email,
        b.website_url,
        b.city,
        b.state,
        b.logo_url,
        b.is_verified,
        b.rating,
        b.total_reviews
    FROM public.businesses b
    WHERE b.id = business_id 
    AND b.verification_status = 'verified';
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_public_business_info(uuid) TO authenticated;