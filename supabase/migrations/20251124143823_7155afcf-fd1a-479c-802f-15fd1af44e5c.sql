-- Add video support columns to relevant tables

-- Community Posts: Add video columns
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT;

-- Services: Add video demos
ALTER TABLE services
ADD COLUMN IF NOT EXISTS video_urls JSONB DEFAULT '[]';

-- Marketplace: Add product videos
ALTER TABLE marketplace_items
ADD COLUMN IF NOT EXISTS video_urls JSONB DEFAULT '[]';

-- Events: Add promo videos
ALTER TABLE events
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT;

-- Advertisement Campaigns: Add video ads
ALTER TABLE advertisement_campaigns
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT;