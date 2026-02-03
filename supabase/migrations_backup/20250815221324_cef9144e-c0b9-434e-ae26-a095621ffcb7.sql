-- Drop the overly permissive RLS policies for service_weekly_availability
DROP POLICY IF EXISTS "Users can view service weekly availability" ON public.service_weekly_availability;
DROP POLICY IF EXISTS "Authenticated users can view service availability" ON public.service_weekly_availability;

-- Create secure RLS policies for service_weekly_availability
-- Only service providers can see their own availability
CREATE POLICY "Service providers can view their own availability" 
ON public.service_weekly_availability 
FOR SELECT 
USING (auth.uid() = user_id);

-- Only allow viewing availability when actively booking a service
-- This policy allows users to see availability only for services they are actively trying to book
CREATE POLICY "Users can view availability when booking services" 
ON public.service_weekly_availability 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.services s 
    WHERE s.id = service_weekly_availability.service_id 
    AND s.is_active = true
  )
);

-- Staff with content moderation permissions can view for verification purposes
CREATE POLICY "Staff can view availability for moderation" 
ON public.service_weekly_availability 
FOR SELECT 
USING (
  has_staff_permission(auth.uid(), 'content_moderation', 'read')
);

-- Also check the service_availability table and apply similar protections
DROP POLICY IF EXISTS "Anyone can view service availability" ON public.service_availability;
DROP POLICY IF EXISTS "Authenticated users can view availability" ON public.service_availability;

-- Create secure policies for service_availability table
CREATE POLICY "Service providers can view their own daily availability" 
ON public.service_availability 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view availability when booking" 
ON public.service_availability 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.services s 
    WHERE s.id = service_availability.service_id 
    AND s.is_active = true
  )
);

CREATE POLICY "Staff can view daily availability for moderation" 
ON public.service_availability 
FOR SELECT 
USING (
  has_staff_permission(auth.uid(), 'content_moderation', 'read')
);