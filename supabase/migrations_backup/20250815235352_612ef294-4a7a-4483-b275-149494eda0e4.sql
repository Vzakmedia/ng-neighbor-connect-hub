-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view verified businesses public data" ON public.businesses;

-- Create a secure view for truly public business information (no contact details)
CREATE VIEW public.business_directory AS
SELECT 
    id,
    business_name,
    description,
    category,
    city,
    state,
    logo_url,
    operating_hours,
    is_verified,
    rating,
    total_reviews,
    created_at
FROM public.businesses
WHERE verification_status = 'verified' AND is_verified = true;

-- Grant read access to the directory view
GRANT SELECT ON public.business_directory TO authenticated, anon;

-- Create a function for getting business contact info (only for authenticated users with valid reason)
CREATE OR REPLACE FUNCTION get_business_contact_info(business_id uuid)
RETURNS TABLE(
    id uuid,
    business_name text,
    phone text,
    email text,
    website_url text,
    physical_address text
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT 
        b.id,
        b.business_name,
        b.phone,
        b.email,
        b.website_url,
        b.physical_address
    FROM public.businesses b
    WHERE b.id = business_id 
    AND b.verification_status = 'verified'
    AND b.is_verified = true
    -- Only authenticated users can access contact info
    AND auth.uid() IS NOT NULL;
$$;

-- Grant execute permission only to authenticated users
GRANT EXECUTE ON FUNCTION get_business_contact_info(uuid) TO authenticated;

-- Update the public business info function to exclude sensitive contact data
CREATE OR REPLACE FUNCTION get_public_business_info(business_id uuid)
RETURNS TABLE(
    id uuid,
    business_name text,
    description text,
    category text,
    city text,
    state text,
    logo_url text,
    is_verified boolean,
    rating numeric,
    total_reviews integer,
    operating_hours jsonb
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
        b.city,
        b.state,
        b.logo_url,
        b.is_verified,
        b.rating,
        b.total_reviews,
        b.operating_hours
    FROM public.businesses b
    WHERE b.id = business_id 
    AND b.verification_status = 'verified'
    AND b.is_verified = true;
$$;