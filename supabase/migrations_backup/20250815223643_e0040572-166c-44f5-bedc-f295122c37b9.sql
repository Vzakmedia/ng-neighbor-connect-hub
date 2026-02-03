-- Create user consent tracking table
CREATE TABLE public.user_consents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  terms_accepted boolean NOT NULL DEFAULT false,
  privacy_accepted boolean NOT NULL DEFAULT false,
  data_processing_accepted boolean NOT NULL DEFAULT false,
  location_sharing_accepted boolean NOT NULL DEFAULT false,
  communication_accepted boolean NOT NULL DEFAULT false,
  consent_given_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text,
  consent_version text DEFAULT '1.0',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own consent records" 
ON public.user_consents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consent records" 
ON public.user_consents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consent records" 
ON public.user_consents 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Staff can view all consent records for compliance
CREATE POLICY "Staff can view all consent records" 
ON public.user_consents 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.update_user_consents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_consents_updated_at
BEFORE UPDATE ON public.user_consents
FOR EACH ROW
EXECUTE FUNCTION public.update_user_consents_updated_at();