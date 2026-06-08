-- Remove placeholder seed data inserted by 20250814* migrations.
--
-- Those migrations seeded "Community Coffee Shop", "Springfield Auto Repair",
-- etc. — all in Springfield, Illinois — to demonstrate the marketplace. The
-- app targets Nigeria, so this data is visible to real users as obvious
-- mockups. Since no legitimate user will have "Springfield, Illinois" as
-- their location, the city/state filter is a safe identifier.

-- 1. Businesses (Community Coffee Shop, Springfield Auto Repair, Bella Vista Landscaping)
DELETE FROM public.businesses
WHERE city = 'Springfield'
  AND state = 'Illinois';

-- 2. Services (Home Cleaning, Dog Walking, Tutoring, Handyman)
DELETE FROM public.services
WHERE location = 'Springfield, IL';

-- 3. Marketplace items (Sofa, Bicycle, Camera, Garden Plants)
DELETE FROM public.marketplace_items
WHERE location = 'Springfield, IL';

-- 4. Events (Community Garden Cleanup, BBQ Block Party, Business Mixer)
DELETE FROM public.events
WHERE location ILIKE 'Springfield%'
   OR location ILIKE '%Maple Street Park%'
   OR location = 'Springfield Community Center';

-- 5. Advertisement campaigns targeting Springfield, Illinois
DELETE FROM public.advertisement_campaigns
WHERE 'Springfield' = ANY(target_cities)
  AND 'Illinois' = ANY(target_states);
