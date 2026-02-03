-- Allow anonymous users to upload avatars during signup
CREATE POLICY "Allow anonymous avatar uploads during signup" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'profile-pictures'
);

-- Allow public access to view avatars
CREATE POLICY "Allow public avatar access" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');