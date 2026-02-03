-- Create press releases table
CREATE TABLE public.press_releases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  link TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create job postings table
CREATE TABLE public.job_postings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Full-time',
  remote BOOLEAN DEFAULT false,
  description TEXT NOT NULL,
  requirements TEXT,
  benefits TEXT,
  salary_range TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Create company info table for editable content
CREATE TABLE public.company_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section TEXT NOT NULL UNIQUE,
  title TEXT,
  content TEXT,
  data JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.press_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_info ENABLE ROW LEVEL SECURITY;

-- RLS Policies for press_releases
CREATE POLICY "Anyone can view published press releases" 
ON public.press_releases 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can manage press releases" 
ON public.press_releases 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for job_postings
CREATE POLICY "Anyone can view active job postings" 
ON public.job_postings 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage job postings" 
ON public.job_postings 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for company_info
CREATE POLICY "Anyone can view company info" 
ON public.company_info 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage company info" 
ON public.company_info 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Insert default company info sections
INSERT INTO public.company_info (section, title, content, updated_by) VALUES
('about', 'About NeighborLink', 'NeighborLink is Nigeria''s leading community safety and engagement platform, connecting neighbors through innovative technology to build stronger, safer communities. Founded in 2024, our platform serves over 100,000 active users across major Nigerian cities.', '00000000-0000-0000-0000-000000000000'),
('mission', 'Our Mission', 'Our mission is to empower communities with the tools they need to communicate effectively, respond to emergencies quickly, and build meaningful connections with their neighbors. Through features like real-time safety alerts, community forums, local services directory, and emergency response coordination, NeighborLink is transforming how Nigerian communities interact and support each other.', '00000000-0000-0000-0000-000000000000'),
('statistics', 'Key Statistics', '{}', '00000000-0000-0000-0000-000000000000'),
('media_contact', 'Media Contact', '{}', '00000000-0000-0000-0000-000000000000');

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_press_releases_updated_at
  BEFORE UPDATE ON public.press_releases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_info_updated_at
  BEFORE UPDATE ON public.company_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();