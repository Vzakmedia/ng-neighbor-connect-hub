-- Priority 3: Seed sample data to activate business features and demonstrations

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

-- Insert sample services to demonstrate marketplace
INSERT INTO public.services (
  id,
  user_id,
  title,
  description,
  category,
  subcategory,
  pricing_type,
  base_price,
  location,
  service_area,
  is_available,
  approval_status,
  rating,
  total_reviews
) VALUES 
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), 'Home Cleaning Service', 'Professional residential cleaning with eco-friendly products. Weekly, bi-weekly, or monthly options available.', 'home_services', 'cleaning', 'hourly', 35.00, 'Springfield, IL', 'Springfield and surrounding areas', true, 'approved', 4.9, 43),
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), 'Dog Walking & Pet Sitting', 'Reliable pet care services for busy pet parents. Licensed, insured, and experienced with all breeds.', 'personal_services', 'pet_care', 'per_session', 25.00, 'Springfield, IL', 'Within 10 miles of Springfield', true, 'approved', 4.7, 67),
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), 'Tutoring - Math & Science', 'Expert tutoring for middle and high school students. Improve grades and build confidence in STEM subjects.', 'education', 'tutoring', 'hourly', 50.00, 'Springfield, IL', 'Online or in-person within Springfield', true, 'approved', 5.0, 28),
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), 'Handyman Services', 'Small repairs, installations, and home improvement projects. No job too small!', 'home_services', 'maintenance', 'hourly', 45.00, 'Springfield, IL', 'Springfield metro area', true, 'pending', null, 0)
ON CONFLICT (id) DO NOTHING;

-- Insert sample marketplace items
INSERT INTO public.marketplace_items (
  id,
  user_id,
  title,
  description,
  category,
  condition_item,
  price,
  location,
  is_available,
  approval_status,
  rating,
  total_reviews
) VALUES 
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), 'Gently Used Sofa - Navy Blue', 'Comfortable 3-seater sofa in excellent condition. Pet-free, smoke-free home. Moving sale!', 'furniture', 'good', 299.99, 'Springfield, IL', true, 'approved', 4.8, 12),
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), 'Kids Bicycle - 20 inch', 'Red mountain bike perfect for ages 8-12. Includes helmet and training wheels if needed.', 'sporting_goods', 'good', 85.00, 'Springfield, IL', true, 'approved', 4.5, 8),
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), 'Professional Camera Equipment', 'Canon EOS camera with multiple lenses and accessories. Great for photography enthusiasts!', 'electronics', 'excellent', 1299.99, 'Springfield, IL', true, 'pending', null, 0),
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), 'Garden Plants & Herbs', 'Fresh potted herbs and flowering plants. Perfect for starting your spring garden!', 'home_garden', 'new', 15.00, 'Springfield, IL', true, 'approved', 4.9, 23)
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

-- Insert sample advertisement campaigns to demonstrate advertising features
INSERT INTO public.advertisement_campaigns (
  id,
  user_id,
  campaign_name,
  campaign_type,
  ad_title,
  ad_description,
  target_geographic_scope,
  target_cities,
  target_states,
  start_date,
  end_date,
  daily_budget,
  total_budget,
  pricing_tier_id,
  status,
  approval_status
) VALUES 
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), 'Coffee Shop Grand Opening', 'business', 'New Coffee Shop Now Open!', 'Visit our new location for fresh roasted coffee, pastries, and a warm community atmosphere. Grand opening specials all week!', 'city', ARRAY['Springfield'], ARRAY['Illinois'], '2024-03-01 00:00:00+00', '2024-03-31 23:59:59+00', 25.00, 750.00, (SELECT id FROM ad_pricing_tiers LIMIT 1), 'active', 'approved'),
(gen_random_uuid(), (SELECT id FROM auth.users LIMIT 1), 'Spring Landscaping Services', 'service', 'Spring Landscaping Special!', 'Transform your yard this spring! Professional landscaping services with 20% off new customer consultations. Book now for spring planting season.', 'city', ARRAY['Springfield'], ARRAY['Illinois'], '2024-03-15 00:00:00+00', '2024-05-15 23:59:59+00', 35.00, 1050.00, (SELECT id FROM ad_pricing_tiers LIMIT 1), 'active', 'approved')
ON CONFLICT (id) DO NOTHING;

-- Add sample app configuration for notification templates
INSERT INTO public.app_configuration (
  config_type,
  config_key,
  config_value,
  description,
  is_public,
  updated_by
) VALUES 
('notification_templates', 'welcome_message', '{"title": "Welcome to the Community!", "body": "Thanks for joining our neighborhood platform. Start by completing your profile and exploring local events, businesses, and services."}', 'Welcome message for new users', false, (SELECT id FROM auth.users LIMIT 1)),
('notification_templates', 'emergency_alert', '{"title": "Emergency Alert", "body": "An emergency situation has been reported in your area. Please stay safe and follow local authorities guidance."}', 'Emergency alert notification template', false, (SELECT id FROM auth.users LIMIT 1)),
('app_settings', 'max_file_size_mb', '10', 'Maximum file upload size in megabytes', true, (SELECT id FROM auth.users LIMIT 1)),
('app_settings', 'supported_file_types', '["image/jpeg", "image/png", "image/gif", "video/mp4", "application/pdf", "text/plain"]', 'List of supported file types for uploads', true, (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (config_key) DO NOTHING;