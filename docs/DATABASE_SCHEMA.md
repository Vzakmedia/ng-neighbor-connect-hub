# NeighborLink Database Schema

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Core Tables](#core-tables)
4. [Feature Tables](#feature-tables)
5. [System Tables](#system-tables)
6. [Indexes](#indexes)
7. [Functions & Triggers](#functions--triggers)
8. [RLS Policies](#rls-policies)

---

## Overview

NeighborLink uses PostgreSQL via Supabase with Row Level Security (RLS) enforced on all tables. The database contains 130+ tables organized into logical domains.

### Key Design Principles

1. **UUID Primary Keys**: All tables use `gen_random_uuid()` for IDs
2. **Timestamps**: All tables have `created_at`, most have `updated_at`
3. **Soft Deletes**: Critical data uses `is_deleted` flag instead of hard deletes
4. **Denormalization**: Frequently accessed counts stored on parent records
5. **JSONB**: Used for flexible/nested data structures

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER DOMAIN                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  auth.users (Supabase)                                                       │
│       │                                                                      │
│       ├───────────────────────────────────────────────────────────┐          │
│       │                                                           │          │
│       ▼                                                           ▼          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │  profiles   │───▶│   user_     │    │   user_     │    │  emergency  │   │
│  │             │    │  settings   │    │notification_│    │  _contacts  │   │
│  └─────────────┘    └─────────────┘    │ preferences │    └─────────────┘   │
│       │                                └─────────────┘                       │
│       │                                                                      │
└───────┼──────────────────────────────────────────────────────────────────────┘
        │
        │
┌───────┼──────────────────────────────────────────────────────────────────────┐
│       │                        COMMUNITY DOMAIN                              │
├───────┼──────────────────────────────────────────────────────────────────────┤
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                       │
│  │ community_  │───▶│  post_      │    │  post_      │                       │
│  │   posts     │    │  comments   │    │   likes     │                       │
│  └─────────────┘    └─────────────┘    └─────────────┘                       │
│       │                   │                                                  │
│       │                   ▼                                                  │
│       │            ┌─────────────┐    ┌─────────────┐                        │
│       │            │  comment_   │    │  saved_     │                        │
│       │            │   likes     │    │   posts     │                        │
│       │            └─────────────┘    └─────────────┘                        │
│       │                                                                      │
└───────┼──────────────────────────────────────────────────────────────────────┘
        │
        │
┌───────┼──────────────────────────────────────────────────────────────────────┐
│       │                        MESSAGING DOMAIN                              │
├───────┼──────────────────────────────────────────────────────────────────────┤
│       │                                                                      │
│       ├─────────────────────────────────────┐                                │
│       │                                     │                                │
│       ▼                                     ▼                                │
│  ┌─────────────┐                     ┌─────────────┐                         │
│  │   direct_   │                     │   call_     │                         │
│  │conversations│◀────────────────────│    logs     │                         │
│  └──────┬──────┘                     └─────────────┘                         │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────┐                                                             │
│  │   direct_   │                                                             │
│  │  messages   │                                                             │
│  └─────────────┘                                                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                            BUSINESS DOMAIN                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │ businesses  │───▶│  services   │───▶│  service_   │    │  service_   │   │
│  │             │    │             │    │  reviews    │    │  bookings   │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                            SAFETY DOMAIN                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │  safety_    │───▶│   alert_    │    │  panic_     │───▶│   alert_    │   │
│  │   alerts    │    │ responses   │    │   alerts    │    │notifications│   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                          ADVERTISING DOMAIN                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                       │
│  │advertisement│───▶│    ad_      │    │    ad_      │                       │
│  │ _campaigns  │    │interactions │    │pricing_tiers│                       │
│  └─────────────┘    └─────────────┘    └─────────────┘                       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Tables

### `profiles`

User profile information extending `auth.users`.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  city TEXT,
  state TEXT,
  neighborhood TEXT,
  bio TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'super_admin', 'manager', 'support', 'staff')),
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_city_state ON profiles(city, state);
CREATE INDEX idx_profiles_role ON profiles(role);
```

### `user_settings`

User preferences and settings.

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system',
  language TEXT DEFAULT 'en',
  privacy_settings JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  messaging_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### `user_notification_preferences`

Granular notification controls.

```sql
CREATE TABLE user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  in_app_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  safety_alerts BOOLEAN DEFAULT true,
  emergency_alerts BOOLEAN DEFAULT true,
  marketplace_updates BOOLEAN DEFAULT true,
  community_posts BOOLEAN DEFAULT true,
  service_bookings BOOLEAN DEFAULT true,
  messages BOOLEAN DEFAULT true,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone TEXT DEFAULT 'UTC',
  priority_filter TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Feature Tables

### Community

#### `community_posts`

```sql
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  title TEXT,
  image_urls TEXT[] DEFAULT '{}',
  video_url TEXT,
  video_thumbnail_url TEXT,
  file_urls JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  location TEXT,
  location_scope location_scope DEFAULT 'neighborhood',
  target_neighborhood TEXT,
  target_city TEXT,
  target_state TEXT,
  post_type TEXT NOT NULL,
  rsvp_enabled BOOLEAN DEFAULT false,
  
  -- Denormalized counts (updated by triggers)
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  
  -- Full-text search
  search_vector TSVECTOR,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_posts_location_scope ON community_posts(location_scope);
CREATE INDEX idx_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_posts_search ON community_posts USING GIN(search_vector);
CREATE INDEX idx_posts_tags ON community_posts USING GIN(tags);

-- Enum
CREATE TYPE location_scope AS ENUM ('neighborhood', 'city', 'state', 'all');
```

#### `post_likes`

```sql
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_post_likes_composite ON post_likes(user_id, post_id);
```

#### `post_comments`

```sql
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_comments_parent_id ON post_comments(parent_id);
```

### Messaging

#### `direct_conversations`

```sql
CREATE TABLE direct_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one UUID NOT NULL REFERENCES auth.users(id),
  participant_two UUID NOT NULL REFERENCES auth.users(id),
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_one, participant_two)
);

CREATE INDEX idx_conversations_participants ON direct_conversations(participant_one, participant_two);
```

#### `direct_messages`

```sql
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES direct_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT false,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON direct_messages(conversation_id);
CREATE INDEX idx_messages_created_at ON direct_messages(created_at DESC);
CREATE INDEX idx_messages_unread ON direct_messages(recipient_id) WHERE is_read = false;
```

### Safety

#### `safety_alerts`

```sql
CREATE TABLE safety_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('crime', 'fire', 'weather', 'health', 'traffic', 'utility', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_alerts_location ON safety_alerts(latitude, longitude);
CREATE INDEX idx_alerts_active ON safety_alerts(is_active) WHERE is_active = true;
CREATE INDEX idx_alerts_severity ON safety_alerts(severity);
```

#### `panic_alerts`

```sql
CREATE TABLE panic_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'responding', 'resolved', 'cancelled')),
  alert_message TEXT,
  audio_recording_url TEXT,
  responder_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

CREATE INDEX idx_panic_user ON panic_alerts(user_id);
CREATE INDEX idx_panic_status ON panic_alerts(status) WHERE status = 'active';
```

#### `emergency_contacts`

```sql
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  relationship TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  notify_on_panic BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_emergency_user ON emergency_contacts(user_id);
```

### Business

#### `businesses`

```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  email TEXT,
  phone TEXT,
  physical_address TEXT,
  city TEXT,
  state TEXT,
  website_url TEXT,
  operating_hours JSONB DEFAULT '{}',
  tax_id_number TEXT,
  business_license TEXT,
  verification_documents JSONB DEFAULT '[]',
  verification_status TEXT DEFAULT 'pending',
  is_verified BOOLEAN DEFAULT false,
  rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_businesses_user ON businesses(user_id);
CREATE INDEX idx_businesses_category ON businesses(category);
CREATE INDEX idx_businesses_location ON businesses(city, state);
CREATE INDEX idx_businesses_operating_hours ON businesses USING GIN(operating_hours);
```

#### `services`

```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  business_id UUID REFERENCES businesses(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10,2),
  price_type TEXT CHECK (price_type IN ('fixed', 'hourly', 'daily', 'negotiable')),
  images TEXT[] DEFAULT '{}',
  location TEXT,
  city TEXT,
  state TEXT,
  is_active BOOLEAN DEFAULT true,
  availability JSONB DEFAULT '{}',
  rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_location ON services(city, state);
```

### Advertising

#### `advertisement_campaigns`

```sql
CREATE TABLE advertisement_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  business_id UUID REFERENCES businesses(id),
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  approval_status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Pricing
  pricing_tier_id UUID NOT NULL REFERENCES ad_pricing_tiers(id),
  total_budget NUMERIC(10,2) NOT NULL,
  daily_budget NUMERIC(10,2) NOT NULL,
  total_spent NUMERIC(10,2) DEFAULT 0,
  
  -- Targeting
  target_geographic_scope TEXT NOT NULL,
  target_cities TEXT[] DEFAULT '{}',
  target_states TEXT[] DEFAULT '{}',
  target_coordinates JSONB,
  
  -- Schedule
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Creative
  ad_title TEXT,
  ad_description TEXT,
  ad_images JSONB DEFAULT '[]',
  ad_url TEXT,
  ad_call_to_action TEXT,
  video_url TEXT,
  video_thumbnail_url TEXT,
  
  -- Content references
  community_post_id UUID REFERENCES community_posts(id),
  service_id UUID REFERENCES services(id),
  marketplace_item_id UUID REFERENCES marketplace_items(id),
  event_id UUID,
  
  -- Metrics
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  priority_level INTEGER DEFAULT 1,
  
  -- Payment
  payment_status TEXT DEFAULT 'pending',
  payment_amount NUMERIC(10,2),
  payment_completed_at TIMESTAMPTZ,
  stripe_session_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_campaigns_user ON advertisement_campaigns(user_id);
CREATE INDEX idx_campaigns_status ON advertisement_campaigns(status);
CREATE INDEX idx_campaigns_dates ON advertisement_campaigns(start_date, end_date);
```

#### `ad_pricing_tiers`

```sql
CREATE TABLE ad_pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ad_type TEXT NOT NULL,
  geographic_scope TEXT NOT NULL,
  base_price_per_day NUMERIC(10,2) NOT NULL,
  impressions_included INTEGER,
  click_rate_multiplier NUMERIC(5,2) DEFAULT 1.0,
  priority_level INTEGER DEFAULT 1,
  max_duration_days INTEGER,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## System Tables

### `admin_action_logs`

Audit trail for admin actions.

```sql
CREATE TABLE admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  target_resource_type TEXT,
  target_resource_id UUID,
  action_details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  requires_confirmation BOOLEAN DEFAULT false,
  confirmation_method TEXT,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_admin_logs_admin ON admin_action_logs(admin_user_id);
CREATE INDEX idx_admin_logs_target ON admin_action_logs(target_user_id);
CREATE INDEX idx_admin_logs_created ON admin_action_logs(created_at DESC);
```

### `activity_logs`

General activity tracking.

```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_type ON activity_logs(action_type);
CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);
```

### `analytics_events`

Product analytics events.

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id UUID,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL,
  event_action TEXT NOT NULL,
  event_label TEXT,
  event_data JSONB,
  page_url TEXT,
  referrer TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_event ON analytics_events(event_type, event_category);
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_data ON analytics_events USING GIN(event_data);
```

---

## Indexes

### Composite Indexes

```sql
-- Feed queries
CREATE INDEX idx_posts_feed ON community_posts(location_scope, created_at DESC);
CREATE INDEX idx_posts_user_feed ON community_posts(user_id, created_at DESC);

-- User engagement lookups
CREATE INDEX idx_likes_composite ON post_likes(user_id, post_id);
CREATE INDEX idx_saves_composite ON saved_posts(user_id, post_id);

-- Message queries
CREATE INDEX idx_messages_thread ON direct_messages(conversation_id, created_at DESC);

-- Location-based queries
CREATE INDEX idx_alerts_geo ON safety_alerts(latitude, longitude, is_active);
```

### GIN Indexes (for JSONB/Array)

```sql
CREATE INDEX idx_posts_tags ON community_posts USING GIN(tags);
CREATE INDEX idx_businesses_hours ON businesses USING GIN(operating_hours);
CREATE INDEX idx_analytics_data ON analytics_events USING GIN(event_data);
CREATE INDEX idx_posts_files ON community_posts USING GIN(file_urls);
```

### Partial Indexes

```sql
-- Only active alerts
CREATE INDEX idx_active_alerts ON safety_alerts(created_at DESC) WHERE is_active = true;

-- Only unread messages
CREATE INDEX idx_unread_messages ON direct_messages(recipient_id) WHERE is_read = false;

-- Only pending campaigns
CREATE INDEX idx_pending_campaigns ON advertisement_campaigns(created_at) WHERE approval_status = 'pending';
```

---

## Functions & Triggers

### Update Timestamp Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Denormalized Count Triggers

```sql
-- Increment likes_count on post_likes insert
CREATE OR REPLACE FUNCTION increment_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_posts
  SET likes_count = likes_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_likes
  AFTER INSERT ON post_likes
  FOR EACH ROW EXECUTE FUNCTION increment_post_likes();

-- Decrement on delete
CREATE OR REPLACE FUNCTION decrement_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_posts
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrement_likes
  AFTER DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION decrement_post_likes();
```

### Estimated Count Function

```sql
-- Fast estimated count for admin dashboards
CREATE OR REPLACE FUNCTION get_estimated_count(table_name TEXT)
RETURNS BIGINT AS $$
DECLARE
  result BIGINT;
BEGIN
  SELECT reltuples::BIGINT
  INTO result
  FROM pg_class
  WHERE relname = table_name;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### Profile Auto-Creation

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## RLS Policies

### Profile Policies

```sql
-- Anyone can view profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Post Policies

```sql
-- Public posts visible to all
CREATE POLICY "Posts are viewable by everyone"
  ON community_posts FOR SELECT
  USING (true);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
  ON community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own posts
CREATE POLICY "Users can update own posts"
  ON community_posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete own posts
CREATE POLICY "Users can delete own posts"
  ON community_posts FOR DELETE
  USING (auth.uid() = user_id);
```

### Message Policies

```sql
-- Users can only see their own messages
CREATE POLICY "Users can view own messages"
  ON direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can send messages
CREATE POLICY "Users can send messages"
  ON direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Recipients can mark as read
CREATE POLICY "Recipients can update messages"
  ON direct_messages FOR UPDATE
  USING (auth.uid() = recipient_id);
```

### Admin Policies

```sql
-- Admins can view all users
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Super admins can update any profile
CREATE POLICY "Super admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );
```

---

## Next Steps

- [Architecture Overview](./ARCHITECTURE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Component Hierarchy](./COMPONENT_HIERARCHY.md)
