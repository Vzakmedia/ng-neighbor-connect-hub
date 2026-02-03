-- Create a view for public business information that excludes sensitive data
CREATE OR REPLACE VIEW public.public_businesses AS
SELECT 
    id,
    user_id,
    business_name,
    description,
    category,
    phone,
    email,
    website_url,
    physical_address,
    city,
    state,
    logo_url,
    operating_hours,
    is_verified,
    rating,
    total_reviews,
    created_at,
    updated_at
FROM public.businesses
WHERE verification_status = 'verified';

-- Grant access to the public view
GRANT SELECT ON public.public_businesses TO authenticated;

-- Drop the overly permissive policy for verified businesses
DROP POLICY IF EXISTS "Authenticated users can view verified businesses" ON public.businesses;

-- Create more restrictive policies for the businesses table

-- Business owners can view their own complete business data
CREATE POLICY "Business owners can view their own businesses" 
ON public.businesses 
FOR SELECT 
USING (auth.uid() = user_id);

-- Staff can view all business data for verification purposes
CREATE POLICY "Staff can view businesses for verification" 
ON public.businesses 
FOR SELECT 
USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'moderator'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
);

-- Create a function to get public business data for services and marketplace
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
SECURITY DEFINER
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