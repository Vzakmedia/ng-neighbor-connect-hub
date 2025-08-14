-- Fix ad_pricing_tiers security: Restrict pricing data access to authenticated users only

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Anyone can view active pricing tiers" ON public.ad_pricing_tiers;

-- Create restrictive policy for authenticated users only
CREATE POLICY "Authenticated users can view active pricing tiers" 
ON public.ad_pricing_tiers 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND (is_active = true)
);