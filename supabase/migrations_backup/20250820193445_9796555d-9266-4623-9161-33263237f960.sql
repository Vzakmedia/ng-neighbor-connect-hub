-- Update marketplace items policy
DROP POLICY IF EXISTS "Users can view approved marketplace items" ON public.marketplace_items;
CREATE POLICY "All authenticated users can view marketplace items" 
ON public.marketplace_items 
FOR SELECT 
TO authenticated
USING (approval_status = 'approved');