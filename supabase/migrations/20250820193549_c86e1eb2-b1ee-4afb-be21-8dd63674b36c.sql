-- Update services policy
DROP POLICY IF EXISTS "Users can view approved services" ON public.services;
CREATE POLICY "All authenticated users can view services" 
ON public.services 
FOR SELECT 
TO authenticated
USING (approval_status = 'approved');