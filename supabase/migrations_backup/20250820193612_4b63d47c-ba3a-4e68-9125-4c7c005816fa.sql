-- Update advertisement campaigns policy
DROP POLICY IF EXISTS "Users can view active advertisement campaigns" ON public.advertisement_campaigns;
CREATE POLICY "All authenticated users can view active ads" 
ON public.advertisement_campaigns 
FOR SELECT 
TO authenticated
USING (status = 'active' AND approval_status = 'approved');