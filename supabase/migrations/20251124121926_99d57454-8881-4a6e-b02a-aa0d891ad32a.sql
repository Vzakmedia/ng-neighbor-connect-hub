-- Update existing categories with heroicons and add new categories

-- Update existing categories with heroicons
UPDATE recommendation_categories SET icon = 'SparklesIcon' WHERE slug = 'nigerian-cuisine';
UPDATE recommendation_categories SET icon = 'GlobeAltIcon' WHERE slug = 'international';
UPDATE recommendation_categories SET icon = 'ShoppingBagIcon' WHERE slug = 'fast-food';
UPDATE recommendation_categories SET icon = 'StarIcon' WHERE slug = 'fine-dining';
UPDATE recommendation_categories SET icon = 'FireIcon' WHERE slug = 'street-food';
UPDATE recommendation_categories SET icon = 'CakeIcon' WHERE slug = 'cafes-bakeries';
UPDATE recommendation_categories SET icon = 'SparklesIcon' WHERE slug = 'beauty-spa';
UPDATE recommendation_categories SET icon = 'BoltIcon' WHERE slug = 'fitness';
UPDATE recommendation_categories SET icon = 'TruckIcon' WHERE slug = 'auto-services';
UPDATE recommendation_categories SET icon = 'HomeModernIcon' WHERE slug = 'home-services';
UPDATE recommendation_categories SET icon = 'HeartIcon' WHERE slug = 'health';
UPDATE recommendation_categories SET icon = 'AcademicCapIcon' WHERE slug = 'education';
UPDATE recommendation_categories SET icon = 'MapIcon' WHERE slug = 'parks-nature';
UPDATE recommendation_categories SET icon = 'SunIcon' WHERE slug = 'viewpoints';
UPDATE recommendation_categories SET icon = 'BuildingStorefrontIcon' WHERE slug = 'local-markets';
UPDATE recommendation_categories SET icon = 'BuildingLibraryIcon' WHERE slug = 'cultural-sites';
UPDATE recommendation_categories SET icon = 'PaintBrushIcon' WHERE slug = 'art-galleries';
UPDATE recommendation_categories SET icon = 'MoonIcon' WHERE slug = 'quiet-spots';
UPDATE recommendation_categories SET icon = 'CalendarIcon' WHERE slug = 'events';
UPDATE recommendation_categories SET icon = 'RocketLaunchIcon' WHERE slug = 'activities';
UPDATE recommendation_categories SET icon = 'FilmIcon' WHERE slug = 'entertainment';
UPDATE recommendation_categories SET icon = 'WrenchIcon' WHERE slug = 'workshops';

-- Add new restaurant categories
INSERT INTO recommendation_categories (name, slug, description, icon, color, recommendation_type, display_order, is_active)
VALUES
  ('Vegetarian & Vegan', 'vegetarian-vegan', 'Plant-based dining options', 'BeakerIcon', '#48BB78', 'restaurant', 23, true),
  ('Desserts & Ice Cream', 'desserts-ice-cream', 'Sweet treats and frozen delights', 'CakeIcon', '#F687B3', 'restaurant', 24, true),
  ('Seafood', 'seafood', 'Fresh fish and seafood restaurants', 'GlobeAltIcon', '#4299E1', 'restaurant', 25, true),
  ('Barbecue & Grills', 'barbecue-grills', 'BBQ and grilled specialties', 'FireIcon', '#E53E3E', 'restaurant', 26, true),
  ('Asian Cuisine', 'asian-cuisine', 'Chinese, Japanese, Thai, and more', 'GlobeAltIcon', '#F6AD55', 'restaurant', 27, true);

-- Add new service categories
INSERT INTO recommendation_categories (name, slug, description, icon, color, recommendation_type, display_order, is_active)
VALUES
  ('Photography', 'photography', 'Professional photography services', 'CameraIcon', '#4299E1', 'service', 28, true),
  ('Event Planning', 'event-planning', 'Party and event organization', 'CalendarIcon', '#D69E2E', 'service', 29, true),
  ('Tech & Repairs', 'tech-repairs', 'Phone, computer, and gadget repairs', 'CpuChipIcon', '#805AD5', 'service', 30, true),
  ('Legal Services', 'legal-services', 'Lawyers and legal consultation', 'ScaleIcon', '#2D3748', 'service', 31, true),
  ('Pet Services', 'pet-services', 'Veterinary, grooming, and pet care', 'HeartIcon', '#ED8936', 'service', 32, true),
  ('Laundry & Dry Cleaning', 'laundry-dry-cleaning', 'Professional laundry services', 'SparklesIcon', '#4299E1', 'service', 33, true),
  ('Moving & Storage', 'moving-storage', 'Relocation and storage solutions', 'TruckIcon', '#38A169', 'service', 34, true);

-- Add new hidden gem categories  
INSERT INTO recommendation_categories (name, slug, description, icon, color, recommendation_type, display_order, is_active)
VALUES
  ('Historic Landmarks', 'historic-landmarks', 'Historical monuments and sites', 'BuildingLibraryIcon', '#744210', 'hidden_gem', 35, true),
  ('Street Art', 'street-art', 'Murals and urban art spots', 'PaintBrushIcon', '#ED64A6', 'hidden_gem', 36, true),
  ('Music Venues', 'music-venues', 'Live music and performance spaces', 'MusicalNoteIcon', '#805AD5', 'hidden_gem', 37, true),
  ('Sports Facilities', 'sports-facilities', 'Gyms, courts, and sports centers', 'TrophyIcon', '#E53E3E', 'hidden_gem', 38, true),
  ('Study Spots', 'study-spots', 'Quiet places to work and study', 'BookOpenIcon', '#3182CE', 'hidden_gem', 39, true),
  ('Nightlife', 'nightlife', 'Bars, clubs, and evening entertainment', 'MoonIcon', '#9F7AEA', 'hidden_gem', 40, true),
  ('Hiking Trails', 'hiking-trails', 'Walking and hiking paths', 'MapIcon', '#38A169', 'hidden_gem', 41, true),
  ('Food Trucks', 'food-trucks', 'Mobile food vendors and trucks', 'TruckIcon', '#DD6B20', 'hidden_gem', 42, true);

-- Fix icon names to use proper heroicon names (without Icon suffix)
UPDATE recommendation_categories SET icon = 'Sparkles' WHERE icon = 'SparklesIcon';
UPDATE recommendation_categories SET icon = 'GlobeAlt' WHERE icon = 'GlobeAltIcon';
UPDATE recommendation_categories SET icon = 'ShoppingBag' WHERE icon = 'ShoppingBagIcon';
UPDATE recommendation_categories SET icon = 'Star' WHERE icon = 'StarIcon';
UPDATE recommendation_categories SET icon = 'Fire' WHERE icon = 'FireIcon';
UPDATE recommendation_categories SET icon = 'Cake' WHERE icon = 'CakeIcon';
UPDATE recommendation_categories SET icon = 'Bolt' WHERE icon = 'BoltIcon';
UPDATE recommendation_categories SET icon = 'Truck' WHERE icon = 'TruckIcon';
UPDATE recommendation_categories SET icon = 'HomeModern' WHERE icon = 'HomeModernIcon';
UPDATE recommendation_categories SET icon = 'Heart' WHERE icon = 'HeartIcon';
UPDATE recommendation_categories SET icon = 'AcademicCap' WHERE icon = 'AcademicCapIcon';
UPDATE recommendation_categories SET icon = 'Map' WHERE icon = 'MapIcon';
UPDATE recommendation_categories SET icon = 'Sun' WHERE icon = 'SunIcon';
UPDATE recommendation_categories SET icon = 'BuildingStorefront' WHERE icon = 'BuildingStorefrontIcon';
UPDATE recommendation_categories SET icon = 'BuildingLibrary' WHERE icon = 'BuildingLibraryIcon';
UPDATE recommendation_categories SET icon = 'PaintBrush' WHERE icon = 'PaintBrushIcon';
UPDATE recommendation_categories SET icon = 'Moon' WHERE icon = 'MoonIcon';
UPDATE recommendation_categories SET icon = 'Calendar' WHERE icon = 'CalendarIcon';
UPDATE recommendation_categories SET icon = 'RocketLaunch' WHERE icon = 'RocketLaunchIcon';
UPDATE recommendation_categories SET icon = 'Film' WHERE icon = 'FilmIcon';
UPDATE recommendation_categories SET icon = 'Wrench' WHERE icon = 'WrenchIcon';
UPDATE recommendation_categories SET icon = 'Beaker' WHERE icon = 'BeakerIcon';
UPDATE recommendation_categories SET icon = 'Camera' WHERE icon = 'CameraIcon';
UPDATE recommendation_categories SET icon = 'CpuChip' WHERE icon = 'CpuChipIcon';
UPDATE recommendation_categories SET icon = 'Scale' WHERE icon = 'ScaleIcon';
UPDATE recommendation_categories SET icon = 'Trophy' WHERE icon = 'TrophyIcon';
UPDATE recommendation_categories SET icon = 'BookOpen' WHERE icon = 'BookOpenIcon';
UPDATE recommendation_categories SET icon = 'MusicalNote' WHERE icon = 'MusicalNoteIcon';