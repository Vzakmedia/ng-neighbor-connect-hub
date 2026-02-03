-- Create user preferences table for onboarding settings
CREATE TABLE IF NOT EXISTS public.user_onboarding_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_completion_reminders BOOLEAN DEFAULT true,
  business_creation_reminders BOOLEAN DEFAULT true,
  last_business_card_shown_at TIMESTAMP WITH TIME ZONE,
  business_card_permanently_dismissed BOOLEAN DEFAULT false,
  profile_completion_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_onboarding_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own onboarding preferences"
  ON public.user_onboarding_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding preferences"
  ON public.user_onboarding_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding preferences"
  ON public.user_onboarding_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to initialize user onboarding preferences
CREATE OR REPLACE FUNCTION public.initialize_user_onboarding_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_onboarding_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-initialize onboarding preferences for new users
CREATE OR REPLACE TRIGGER on_auth_user_created_onboarding
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_onboarding_preferences();

-- Create function to check if user profile is complete
CREATE OR REPLACE FUNCTION public.is_profile_complete(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT full_name, phone, address, neighborhood, city, state
  INTO profile_record
  FROM public.profiles
  WHERE user_id = target_user_id;
  
  -- Profile is considered complete if essential fields are filled
  RETURN (
    profile_record.full_name IS NOT NULL AND profile_record.full_name != '' AND
    profile_record.phone IS NOT NULL AND profile_record.phone != '' AND
    profile_record.address IS NOT NULL AND profile_record.address != '' AND
    profile_record.neighborhood IS NOT NULL AND profile_record.neighborhood != '' AND
    profile_record.city IS NOT NULL AND profile_record.city != '' AND
    profile_record.state IS NOT NULL AND profile_record.state != ''
  );
END;
$$;

-- Create function to check if user has a business
CREATE OR REPLACE FUNCTION public.user_has_business(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.businesses
    WHERE user_id = target_user_id
  );
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE TRIGGER update_user_onboarding_preferences_updated_at
  BEFORE UPDATE ON public.user_onboarding_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();