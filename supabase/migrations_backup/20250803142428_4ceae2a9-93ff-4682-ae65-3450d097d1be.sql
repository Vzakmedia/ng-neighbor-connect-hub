-- Add image fields to promotion campaigns table
ALTER TABLE promotion_campaigns ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- Add image field to promoted posts table (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promoted_posts' AND column_name = 'images') THEN
        ALTER TABLE promoted_posts ADD COLUMN images text[] DEFAULT '{}';
    END IF;
END $$;

-- Add image field to sponsored content table (if it doesn't exist)  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sponsored_content' AND column_name = 'images') THEN
        ALTER TABLE sponsored_content ADD COLUMN images text[] DEFAULT '{}';
    END IF;
END $$;

-- Create storage bucket for promotion images
INSERT INTO storage.buckets (id, name, public)
VALUES ('promotion-images', 'promotion-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for promotion images
CREATE POLICY "Promotion images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'promotion-images');

CREATE POLICY "Users can upload their own promotion images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
    bucket_id = 'promotion-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own promotion images" 
ON storage.objects 
FOR UPDATE 
USING (
    bucket_id = 'promotion-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own promotion images" 
ON storage.objects 
FOR DELETE 
USING (
    bucket_id = 'promotion-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);