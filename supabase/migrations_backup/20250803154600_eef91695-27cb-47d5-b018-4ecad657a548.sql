-- Create storage bucket for press materials
INSERT INTO storage.buckets (id, name, public) VALUES ('press-materials', 'press-materials', true);

-- Create policies for press materials bucket
CREATE POLICY "Press materials are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'press-materials');

CREATE POLICY "Admins can upload press materials" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'press-materials' AND has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can update press materials" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'press-materials' AND has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can delete press materials" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'press-materials' AND has_role(auth.uid(), 'super_admin'::app_role));