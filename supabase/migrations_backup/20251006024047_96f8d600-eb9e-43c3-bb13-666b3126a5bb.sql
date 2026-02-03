-- Create storage bucket for onboarding assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'onboarding-assets', 
  'onboarding-assets', 
  true,
  5242880, -- 5MB limit per file
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read access policy
CREATE POLICY "Onboarding assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'onboarding-assets');

-- Admin upload policy
CREATE POLICY "Admins can upload onboarding assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'onboarding-assets' 
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'staff')
    )
    OR auth.uid() IS NULL
  )
);

-- Admin update policy
CREATE POLICY "Admins can update onboarding assets" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'onboarding-assets'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  )
);

-- Admin delete policy
CREATE POLICY "Admins can delete onboarding assets" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'onboarding-assets'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  )
);