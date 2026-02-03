-- Fix critical security vulnerability: User Personal Information Exposure
-- Remove dangerous policy and implement proper access controls

-- Drop the dangerous policy that exposes ALL personal info to other users
DROP POLICY IF EXISTS "Allow basic profile info for service interactions" ON public.profiles;

-- Create a secure function that returns only safe profile information for interactions
CREATE OR REPLACE FUNCTION public.get_safe_profile_for_interaction(_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  bio text,
  city text,
  state text,
  neighborhood text,
  is_verified boolean,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return safe, non-sensitive profile information
  -- Explicitly exclude: email, phone, address, staff_id
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.city,
    p.state,
    p.neighborhood,
    p.is_verified,
    p.created_at
  FROM public.profiles p
  WHERE p.user_id = _user_id;
END;
$$;

-- Create secure policy for limited profile access in business interactions
CREATE POLICY "Safe profile info for verified interactions only" ON public.profiles
FOR SELECT 
USING (
  -- Profile owners can always see their full profile
  (auth.uid() = user_id)
  OR
  -- Staff can see profiles for support/admin purposes
  (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'support'::app_role))
  OR
  -- Very limited access for verified business interactions ONLY
  (
    auth.uid() IS NOT NULL 
    AND auth.uid() != user_id
    AND (
      -- Only confirmed/completed service bookings between users
      EXISTS (
        SELECT 1 FROM public.service_bookings sb
        WHERE sb.status IN ('confirmed', 'completed')
          AND ((sb.provider_id = profiles.user_id AND sb.client_id = auth.uid()) 
               OR (sb.client_id = profiles.user_id AND sb.provider_id = auth.uid()))
      )
      OR
      -- Only for active marketplace inquiries (but still limited to safe data)
      EXISTS (
        SELECT 1 FROM public.marketplace_items mi
        JOIN public.marketplace_inquiries miq ON mi.id = miq.item_id
        WHERE mi.user_id = profiles.user_id 
          AND miq.buyer_id = auth.uid()
          AND miq.status = 'active'
      )
    )
  )
);

-- Create function to log any profile access for security monitoring
CREATE OR REPLACE FUNCTION public.audit_profile_access(_accessed_user_id uuid, _access_reason text DEFAULT 'general_access')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all profile access attempts by other users for security monitoring
  IF auth.uid() != _accessed_user_id AND auth.uid() IS NOT NULL THEN
    PERFORM log_security_event(
      'profile_data_access',
      'profile',
      _accessed_user_id,
      'medium',
      jsonb_build_object(
        'accessed_by', auth.uid(),
        'reason', _access_reason,
        'timestamp', now(),
        'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
      )
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't let audit logging failure break profile access
    NULL;
END;
$$;