-- Add has_completed_onboarding column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;

-- Set existing users to have completed onboarding (so they don't see it again)
UPDATE public.profiles 
SET has_completed_onboarding = true 
WHERE has_completed_onboarding IS NULL OR has_completed_onboarding = false;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON public.profiles(has_completed_onboarding);