-- Add default location filter preference to user_onboarding_preferences table
ALTER TABLE public.user_onboarding_preferences 
ADD COLUMN default_location_filter text DEFAULT 'neighborhood';

-- Add check constraint to ensure valid values
ALTER TABLE public.user_onboarding_preferences 
ADD CONSTRAINT check_default_location_filter 
CHECK (default_location_filter IN ('neighborhood', 'city', 'state', 'all'));