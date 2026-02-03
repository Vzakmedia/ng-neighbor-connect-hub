-- Enable RLS on businesses table and add proper policies
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Super admins can view all businesses  
CREATE POLICY "Super admins can view all businesses" 
ON public.businesses 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Users can view verified businesses
CREATE POLICY "Verified businesses are viewable by everyone" 
ON public.businesses 
FOR SELECT 
USING (verification_status = 'verified');

-- Users can manage their own businesses
CREATE POLICY "Users can manage their own businesses" 
ON public.businesses 
FOR ALL 
USING (auth.uid() = user_id);