-- Drop the overly permissive policy that allows access to all columns
DROP POLICY IF EXISTS "Public can view verified business directory info" ON public.businesses;

-- Create a separate table for public business information to completely isolate sensitive data
CREATE TABLE IF NOT EXISTS public.business_public_info (
    id UUID PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    city TEXT,
    state TEXT,
    logo_url TEXT,
    operating_hours JSONB DEFAULT '{}',
    is_verified BOOLEAN DEFAULT false,
    rating NUMERIC,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on the public info table
ALTER TABLE public.business_public_info ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read from the public business info table
CREATE POLICY "Anyone can view public business info"
ON public.business_public_info
FOR SELECT
USING (is_verified = true);

-- Allow business owners to manage their public info
CREATE POLICY "Business owners can manage their public info"
ON public.business_public_info
FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.businesses b 
    WHERE b.id = business_public_info.id 
    AND b.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.businesses b 
    WHERE b.id = business_public_info.id 
    AND b.user_id = auth.uid()
));

-- Allow staff to manage public info
CREATE POLICY "Staff can manage public business info"
ON public.business_public_info
FOR ALL
USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'moderator'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
);

-- Create a trigger to automatically sync public info when businesses are updated
CREATE OR REPLACE FUNCTION sync_business_public_info()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert or update public info
    INSERT INTO public.business_public_info (
        id, business_name, description, category, city, state, 
        logo_url, operating_hours, is_verified, rating, total_reviews, 
        created_at, updated_at
    )
    VALUES (
        NEW.id, NEW.business_name, NEW.description, NEW.category, 
        NEW.city, NEW.state, NEW.logo_url, NEW.operating_hours, 
        NEW.is_verified, NEW.rating, NEW.total_reviews, 
        NEW.created_at, now()
    )
    ON CONFLICT (id) 
    DO UPDATE SET
        business_name = EXCLUDED.business_name,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        logo_url = EXCLUDED.logo_url,
        operating_hours = EXCLUDED.operating_hours,
        is_verified = EXCLUDED.is_verified,
        rating = EXCLUDED.rating,
        total_reviews = EXCLUDED.total_reviews,
        updated_at = now();
    
    RETURN NEW;
END;
$$;

-- Create triggers for insert and update
DROP TRIGGER IF EXISTS sync_business_public_info_insert ON public.businesses;
CREATE TRIGGER sync_business_public_info_insert
    AFTER INSERT ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION sync_business_public_info();

DROP TRIGGER IF EXISTS sync_business_public_info_update ON public.businesses;
CREATE TRIGGER sync_business_public_info_update
    AFTER UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION sync_business_public_info();

-- Populate the public info table with existing verified businesses
INSERT INTO public.business_public_info (
    id, business_name, description, category, city, state, 
    logo_url, operating_hours, is_verified, rating, total_reviews, 
    created_at, updated_at
)
SELECT 
    id, business_name, description, category, city, state, 
    logo_url, operating_hours, is_verified, rating, total_reviews, 
    created_at, updated_at
FROM public.businesses
WHERE verification_status = 'verified'
ON CONFLICT (id) DO NOTHING;

-- Update the business directory function to use the new secure table
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
    SELECT 
        bpi.id,
        bpi.business_name,
        bpi.description,
        bpi.category,
        bpi.city,
        bpi.state,
        bpi.logo_url,
        bpi.operating_hours,
        bpi.is_verified,
        bpi.rating,
        bpi.total_reviews,
        bpi.created_at
    FROM public.business_public_info bpi
    WHERE bpi.is_verified = true;
$$;