-- Create storage bucket for event files
INSERT INTO storage.buckets (id, name, public) VALUES ('event-files', 'event-files', true);

-- Create policies for event files
CREATE POLICY "Event files are viewable by everyone" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'event-files');

CREATE POLICY "Users can upload event files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'event-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own event files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'event-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own event files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'event-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add file_urls column to community_posts table to store uploaded files
ALTER TABLE community_posts ADD COLUMN file_urls JSONB DEFAULT '[]'::jsonb;