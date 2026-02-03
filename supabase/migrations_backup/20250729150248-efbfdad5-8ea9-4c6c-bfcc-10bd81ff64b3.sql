-- Create businesses table for business listings and verification
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  phone TEXT,
  email TEXT,
  website_url TEXT,
  physical_address TEXT,
  city TEXT,
  state TEXT,
  logo_url TEXT,
  operating_hours JSONB DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending',
  verification_documents JSONB DEFAULT '[]',
  tax_id_number TEXT,
  business_license TEXT,
  rating DECIMAL(2,1),
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Create policies for businesses
CREATE POLICY "Verified businesses are viewable by everyone" 
ON public.businesses 
FOR SELECT 
USING (verification_status = 'verified');

CREATE POLICY "Users can view their own businesses" 
ON public.businesses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own businesses" 
ON public.businesses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own businesses" 
ON public.businesses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all businesses" 
ON public.businesses 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to update timestamps
CREATE TRIGGER update_businesses_updated_at
BEFORE UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_businesses_verification_status ON public.businesses(verification_status);
CREATE INDEX idx_businesses_category ON public.businesses(category);
CREATE INDEX idx_businesses_city ON public.businesses(city);
CREATE INDEX idx_businesses_user_id ON public.businesses(user_id);