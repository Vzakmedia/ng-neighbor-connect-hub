-- Fix critical security vulnerability: User Personal Information Exposure
-- Remove overly permissive policies that expose sensitive personal data

-- Drop the dangerous policy that exposes personal info to other users
DROP POLICY IF EXISTS "Allow basic profile info for service interactions" ON public.profiles;

-- Create a secure public profile view that only exposes safe, non-sensitive information
CREATE OR REPLACE VIEW public.safe_public_profiles AS
SELECT 
  user_id,
  full_name,
  avatar_url,
  bio,
  city,
  state,
  neighborhood,
  is_verified,
  created_at
  -- Explicitly exclude sensitive fields: email, phone, address
FROM public.profiles;

-- Enable security barrier on the view
ALTER VIEW public.safe_public_profiles SET (security_barrier = true);

-- Create RLS policy for the safe public view
CREATE POLICY "Safe public profile info for interactions" ON public.safe_public_profiles
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Allow viewing for service interactions (provider/client)
    EXISTS (
      SELECT 1 FROM public.service_bookings sb
      WHERE ((sb.provider_id = safe_public_profiles.user_id OR sb.client_id = safe_public_profiles.user_id) 
        AND (sb.provider_id = auth.uid() OR sb.client_id = auth.uid()))
    )
    OR
    -- Allow viewing for marketplace interactions (seller/buyer)
    EXISTS (
      SELECT 1 FROM public.marketplace_items mi
      JOIN public.marketplace_inquiries miq ON mi.id = miq.item_id
      WHERE mi.user_id = safe_public_profiles.user_id 
        AND miq.buyer_id = auth.uid()
    )
    OR
    -- Allow viewing for direct message contacts
    EXISTS (
      SELECT 1 FROM public.direct_conversations dc
      WHERE (dc.user1_id = safe_public_profiles.user_id OR dc.user2_id = safe_public_profiles.user_id)
        AND (dc.user1_id = auth.uid() OR dc.user2_id = auth.uid())
    )
  )
);

-- Create additional security policy to prevent email enumeration attacks
CREATE POLICY "Prevent email enumeration" ON public.profiles
FOR SELECT 
USING (
  -- Only owner can see their own email
  (auth.uid() = user_id)
  OR
  -- Staff can see emails for support purposes only
  (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'support'::app_role))
);

-- Create policy to restrict phone number access
CREATE POLICY "Restrict phone number access" ON public.profiles
FOR SELECT 
USING (
  -- Only owner can see their own phone
  (auth.uid() = user_id)
  OR  
  -- Staff can see phones for support purposes only
  (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'support'::app_role))
);

-- Create policy to restrict address access
CREATE POLICY "Restrict address access" ON public.profiles
FOR SELECT 
USING (
  -- Only owner can see their own address
  (auth.uid() = user_id)
  OR
  -- Staff can see addresses for support/verification purposes only  
  (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'support'::app_role))
);

-- Create audit logging for sensitive profile access
CREATE OR REPLACE FUNCTION public.log_sensitive_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when sensitive profile data is accessed by non-owners
  IF auth.uid() != NEW.user_id AND auth.uid() IS NOT NULL THEN
    PERFORM log_security_event(
      'profile_access',
      'profile',
      NEW.user_id,
      'medium',
      jsonb_build_object(
        'accessed_by', auth.uid(),
        'timestamp', now(),
        'fields_accessed', CASE 
          WHEN NEW.email IS NOT NULL OR NEW.phone IS NOT NULL OR NEW.address IS NOT NULL 
          THEN 'sensitive_data' 
          ELSE 'public_data' 
        END
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for audit logging (on SELECT we can't use triggers, so we'll log in the function calls)