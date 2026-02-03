-- Priority 3: Seed sample data to activate business features and demonstrations (Fixed)

-- Insert sample businesses to demonstrate business features
INSERT INTO public.businesses (
  id,
  user_id, 
  business_name,
  description,
  category,
  phone,
  email,
  physical_address,
  city,
  state,
  verification_status,
  is_verified,
  rating,
  total_reviews
) VALUES 
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), 'Community Coffee Shop', 'Your neighborhood coffee destination with fresh roasted beans and cozy atmosphere', 'food_beverage', '(555) 123-4567', 'hello@communitycoffee.com', '123 Main Street', 'Springfield', 'Illinois', 'verified', true, 4.8, 127),
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), 'Springfield Auto Repair', 'Professional automotive services with 20+ years experience. Fair pricing, quality work guaranteed.', 'automotive', '(555) 987-6543', 'service@springfieldauto.com', '456 Oak Avenue', 'Springfield', 'Illinois', 'verified', true, 4.6, 89),
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), 'Bella Vista Landscaping', 'Transform your outdoor space with professional landscaping and maintenance services', 'home_garden', '(555) 456-7890', 'info@bellavista.com', '789 Pine Road', 'Springfield', 'Illinois', 'pending', false, null, 0)
ON CONFLICT (id) DO NOTHING;

-- Insert sample services to demonstrate marketplace (without subcategory column)
INSERT INTO public.services (
  id,
  user_id,
  title,
  description,
  category,
  pricing_type,
  price,
  location,
  service_area,
  is_available,
  approval_status,
  rating,
  total_reviews
) VALUES 
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), 'Home Cleaning Service', 'Professional residential cleaning with eco-friendly products. Weekly, bi-weekly, or monthly options available.', 'home_services', 'hourly', 35.00, 'Springfield, IL', 'Springfield and surrounding areas', true, 'approved', 4.9, 43),
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), 'Dog Walking & Pet Sitting', 'Reliable pet care services for busy pet parents. Licensed, insured, and experienced with all breeds.', 'personal_services', 'per_session', 25.00, 'Springfield, IL', 'Within 10 miles of Springfield', true, 'approved', 4.7, 67),
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), 'Tutoring - Math & Science', 'Expert tutoring for middle and high school students. Improve grades and build confidence in STEM subjects.', 'education', 'hourly', 50.00, 'Springfield, IL', 'Online or in-person within Springfield', true, 'approved', 5.0, 28),
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), 'Handyman Services', 'Small repairs, installations, and home improvement projects. No job too small!', 'home_services', 'hourly', 45.00, 'Springfield, IL', 'Springfield metro area', true, 'pending', null, 0)
ON CONFLICT (id) DO NOTHING;

-- Insert sample events to demonstrate event system
INSERT INTO public.events (
  id,
  user_id,
  title,
  content,
  location,
  event_date,
  rsvp_enabled,
  tags,
  is_public
) VALUES 
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), 'Community Garden Cleanup Day', 'Join us for our monthly community garden cleanup! Bring gloves and water. Light refreshments will be provided. Great opportunity to meet neighbors and beautify our shared space.', 'Springfield Community Garden, 123 Garden Lane', '2024-03-15 09:00:00+00', true, ARRAY['community', 'volunteering', 'outdoors'], true),
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), 'Neighborhood BBQ & Block Party', 'Annual summer block party with food, music, and activities for the whole family! Bring a side dish to share. Live music starts at 6 PM.', 'Maple Street Park', '2024-07-20 16:00:00+00', true, ARRAY['community', 'food', 'music', 'family'], true),
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), 'Local Business Networking Mixer', 'Connect with other local business owners and entrepreneurs. Exchange ideas, build partnerships, and grow your network in a casual setting.', 'Springfield Community Center', '2024-04-10 18:30:00+00', true, ARRAY['business', 'networking', 'professional'], true)
ON CONFLICT (id) DO NOTHING;