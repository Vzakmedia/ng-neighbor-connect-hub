-- Create storage bucket for service galleries
INSERT INTO storage.buckets (id, name, public) VALUES ('service-galleries', 'service-galleries', true);

-- Create RLS policies for service gallery uploads
CREATE POLICY "Users can upload service gallery images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'service-galleries' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service gallery images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'service-galleries');

CREATE POLICY "Users can update their own service gallery images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'service-galleries'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own service gallery images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'service-galleries'
  AND auth.uid()::text = (storage.foldername(name))[1]
);