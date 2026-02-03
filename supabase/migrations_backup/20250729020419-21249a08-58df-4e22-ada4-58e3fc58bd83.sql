-- Add additional fields to promotions table for advertisement format
ALTER TABLE public.promotions 
ADD COLUMN website_url TEXT,
ADD COLUMN contact_info TEXT,
ADD COLUMN images TEXT[] DEFAULT '{}';

-- Update existing promotions to have empty arrays for images
UPDATE public.promotions SET images = '{}' WHERE images IS NULL;