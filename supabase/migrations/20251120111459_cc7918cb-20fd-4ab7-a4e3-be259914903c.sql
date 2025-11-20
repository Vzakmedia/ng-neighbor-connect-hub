-- Create new policy that includes both admin and super_admin roles
CREATE POLICY "Super Admins can manage all businesses"
ON public.businesses
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));