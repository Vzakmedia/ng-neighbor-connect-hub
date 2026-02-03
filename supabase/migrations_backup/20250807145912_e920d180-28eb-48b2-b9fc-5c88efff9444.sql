-- Add tutorial_completed column to user_onboarding_preferences table
ALTER TABLE public.user_onboarding_preferences 
ADD COLUMN tutorial_completed boolean DEFAULT false;