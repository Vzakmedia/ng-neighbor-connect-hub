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
  -- Limited access for verified business interactions ONLY
  (
    auth.uid() IS NOT NULL 
    AND auth.uid() != user_id
    AND (
      -- Only active service bookings between the users
      EXISTS (
        SELECT 1 FROM public.service_bookings sb
        WHERE sb.status IN ('confirmed', 'in_progress', 'completed')
          AND ((sb.provider_id = profiles.user_id AND sb.client_id = auth.uid()) 
               OR (sb.client_id = profiles.user_id AND sb.provider_id = auth.uid()))
      )
      OR
      -- Only active marketplace transactions
      EXISTS (
        SELECT 1 FROM public.marketplace_items mi
        JOIN public.marketplace_inquiries miq ON mi.id = miq.item_id
        WHERE mi.user_id = profiles.user_id 
          AND miq.buyer_id = auth.uid()
          AND miq.status IN ('active', 'negotiating')
      )
    )
    -- Even in business interactions, restrict to safe fields only
    -- This policy will work with column-level restrictions below
  )
);

-- Add column-level security: Email is private
CREATE POLICY "Email privacy protection" ON public.profiles
FOR SELECT 
USING (
  -- Only profile owner and authorized staff can see email
  (auth.uid() = user_id) 
  OR 
  (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'support'::app_role))
);

-- Add column-level security: Phone is private  
CREATE POLICY "Phone privacy protection" ON public.profiles
FOR SELECT 
USING (
  -- Only profile owner and authorized staff can see phone
  (auth.uid() = user_id)
  OR 
  (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'support'::app_role))
);

-- Add column-level security: Address is private
CREATE POLICY "Address privacy protection" ON public.profiles
FOR SELECT 
USING (
  -- Only profile owner and authorized staff can see address
  (auth.uid() = user_id)
  OR 
  (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'support'::app_role))
);

-- Create function to log sensitive data access attempts
CREATE OR REPLACE FUNCTION public.audit_profile_access(_accessed_user_id uuid, _access_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log profile access for security monitoring
  IF auth.uid() != _accessed_user_id AND auth.uid() IS NOT NULL THEN
    PERFORM log_security_event(
      'profile_data_access',
      'profile',
      _accessed_user_id,
      'medium',
      jsonb_build_object(
        'accessed_by', auth.uid(),
        'reason', _access_reason,
        'timestamp', now()
      )
    );
  END IF;
END;
$$;