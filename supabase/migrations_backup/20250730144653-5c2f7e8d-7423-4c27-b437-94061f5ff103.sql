-- Check current user role and add missing admin access for business applications
-- Update business policies to allow moderators and managers access as well

DROP POLICY IF EXISTS "Super admins can view all businesses" ON public.businesses;
DROP POLICY IF EXISTS "Verified businesses are viewable by everyone" ON public.businesses; 
DROP POLICY IF EXISTS "Users can manage their own businesses" ON public.businesses;

-- Create comprehensive business access policies
CREATE POLICY "Admins can view all businesses" 
ON public.businesses 
FOR SELECT 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'moderator'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role)
);

-- Users can view verified businesses
CREATE POLICY "Verified businesses are public" 
ON public.businesses 
FOR SELECT 
USING (verification_status = 'verified');

-- Users can manage their own businesses
CREATE POLICY "Users can manage own businesses" 
ON public.businesses 
FOR ALL 
USING (auth.uid() = user_id);

-- Allow business creation
CREATE POLICY "Users can create businesses" 
ON public.businesses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);