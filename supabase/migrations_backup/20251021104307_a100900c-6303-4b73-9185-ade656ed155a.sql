-- Drop the restrictive moderator-only policy
DROP POLICY IF EXISTS "Moderators can view public profile info" ON public.public_profiles;

-- Create a new policy allowing all authenticated users to view public profiles
CREATE POLICY "Authenticated users can view public profile info" 
ON public.public_profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- This is safe because the view only exposes:
-- user_id, full_name, avatar_url, is_verified, city, state, neighborhood, bio, created_at, updated_at
-- No sensitive data like email, phone, address, etc.