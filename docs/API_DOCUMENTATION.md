# NeighborLink API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Edge Functions](#edge-functions)
4. [Database Tables](#database-tables)
5. [Real-time Subscriptions](#real-time-subscriptions)
6. [Storage Buckets](#storage-buckets)
7. [Error Handling](#error-handling)

---

## Overview

NeighborLink uses Supabase as its backend, providing:
- **REST API**: Auto-generated from PostgreSQL schema via PostgREST
- **Edge Functions**: Custom serverless functions (Deno runtime)
- **Realtime**: WebSocket-based subscriptions
- **Storage**: S3-compatible object storage

### Base URL

```
https://cowiviqhrnmhttugozbz.supabase.co
```

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/rest/v1/` | PostgREST API |
| `/auth/v1/` | Authentication |
| `/storage/v1/` | File storage |
| `/functions/v1/` | Edge functions |
| `/realtime/v1/` | WebSocket |

---

## Authentication

### Headers

All authenticated requests require:

```typescript
headers: {
  'apikey': 'SUPABASE_ANON_KEY',
  'Authorization': `Bearer ${session.access_token}`,
  'Content-Type': 'application/json'
}
```

### Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    data: {
      full_name: 'John Doe'
    }
  }
});
```

### Sign In

```typescript
// Email/Password
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password'
});

// OAuth (Google)
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
});

// Magic Link
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`
  }
});
```

### Session Management

```typescript
// Get current session
const { data: { session } } = await supabase.auth.getSession();

// Listen to auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // Handle sign in
  } else if (event === 'SIGNED_OUT') {
    // Handle sign out
  }
});

// Sign out
await supabase.auth.signOut();

// Sign out all devices
await supabase.auth.signOut({ scope: 'global' });
```

---

## Edge Functions

### Authentication Functions

#### `logout-user`

Signs out a user and cleans up session data.

```typescript
POST /functions/v1/logout-user
Authorization: Bearer <token>

// Response
{ "success": true }
```

#### `delete-account`

Permanently deletes user account and all associated data.

```typescript
POST /functions/v1/delete-account
Authorization: Bearer <token>

Body: {
  "confirmation": "DELETE MY ACCOUNT"
}

// Response
{ "success": true, "message": "Account deleted successfully" }
```

#### `export-user-data`

Exports all user data as JSON.

```typescript
POST /functions/v1/export-user-data
Authorization: Bearer <token>

// Response
{
  "profile": { ... },
  "posts": [ ... ],
  "messages": [ ... ],
  "settings": { ... }
}
```

---

### Community Functions

#### `generate-feed-recommendations`

Generates personalized feed recommendations using AI.

```typescript
POST /functions/v1/generate-feed-recommendations
Authorization: Bearer <token>

Body: {
  "userId": "uuid",
  "limit": 20,
  "locationScope": "neighborhood" | "city" | "state" | "all"
}

// Response
{
  "recommendations": [
    { "postId": "uuid", "score": 0.95, "reason": "Similar interests" },
    ...
  ]
}
```

---

### Communication Functions

#### `send-notification-email`

Sends transactional emails via Resend.

```typescript
POST /functions/v1/send-notification-email
Authorization: Bearer <token>

Body: {
  "to": "user@example.com",
  "subject": "New message",
  "template": "new_message",
  "data": {
    "senderName": "John",
    "messagePreview": "Hey, how are you?"
  }
}

// Response
{ "success": true, "messageId": "resend-message-id" }
```

#### `send-call-notification`

Sends push notification for incoming calls.

```typescript
POST /functions/v1/send-call-notification

Body: {
  "callerId": "uuid",
  "receiverId": "uuid",
  "callType": "audio" | "video",
  "conversationId": "uuid"
}

// Response
{ "success": true }
```

---

### Emergency Functions

#### `update-panic-alert-status`

Updates the status of a panic alert.

```typescript
POST /functions/v1/update-panic-alert-status
Authorization: Bearer <token>

Body: {
  "alertId": "uuid",
  "status": "acknowledged" | "responding" | "resolved",
  "responderId": "uuid",
  "notes": "On my way"
}

// Response
{
  "success": true,
  "alert": { ... }
}
```

#### `emergency-contact-invitation`

Sends invitation to become an emergency contact.

```typescript
POST /functions/v1/emergency-contact-invitation

Body: {
  "inviterId": "uuid",
  "inviteeEmail": "contact@example.com",
  "inviteeName": "Jane Doe",
  "relationship": "spouse"
}

// Response
{ "success": true, "invitationId": "uuid" }
```

---

### Payment Functions

#### `create-ad-campaign-payment`

Creates Stripe checkout session for ad campaigns.

```typescript
POST /functions/v1/create-ad-campaign-payment
Authorization: Bearer <token>

Body: {
  "campaignId": "uuid",
  "pricingTierId": "uuid",
  "duration": 7,
  "successUrl": "https://app.com/success",
  "cancelUrl": "https://app.com/cancel"
}

// Response
{
  "sessionId": "cs_xxx",
  "url": "https://checkout.stripe.com/..."
}
```

#### `stripe-webhook`

Handles Stripe webhook events.

```typescript
POST /functions/v1/stripe-webhook
Stripe-Signature: <signature>

// Handles events:
// - checkout.session.completed
// - payment_intent.succeeded
// - payment_intent.failed
```

---

### Media Functions

#### `generate-cloudinary-signature`

Generates signed upload URL for Cloudinary.

```typescript
POST /functions/v1/generate-cloudinary-signature
Authorization: Bearer <token>

Body: {
  "folder": "user-uploads",
  "resourceType": "image" | "video"
}

// Response
{
  "signature": "xxx",
  "timestamp": 1234567890,
  "cloudName": "xxx",
  "apiKey": "xxx"
}
```

#### `delete-cloudinary-image`

Deletes an image from Cloudinary.

```typescript
POST /functions/v1/delete-cloudinary-image
Authorization: Bearer <token>

Body: {
  "publicId": "user-uploads/image-id"
}

// Response
{ "success": true }
```

---

### Enterprise Functions

#### `generate-enterprise-api-key`

Generates API key for enterprise integrations.

```typescript
POST /functions/v1/generate-enterprise-api-key
Authorization: Bearer <token>

Body: {
  "companyId": "uuid",
  "permissions": ["read:alerts", "write:alerts"],
  "expiresIn": "30d"
}

// Response
{
  "apiKey": "nl_xxx",
  "expiresAt": "2024-02-01T00:00:00Z"
}
```

---

### Utility Functions

#### `nigeria-locations`

Returns Nigerian states and cities for location selection.

```typescript
GET /functions/v1/nigeria-locations

// Response
{
  "states": [
    { "name": "Lagos", "cities": ["Lagos", "Ikeja", "Lekki", ...] },
    ...
  ]
}
```

#### `get-google-maps-token`

Returns Google Maps API key for client-side use.

```typescript
GET /functions/v1/get-google-maps-token

// Response
{ "token": "AIza..." }
```

#### `get-turn-credentials`

Returns TURN server credentials for WebRTC.

```typescript
GET /functions/v1/get-turn-credentials
Authorization: Bearer <token>

// Response
{
  "urls": ["turn:turn.example.com:3478"],
  "username": "xxx",
  "credential": "xxx"
}
```

---

## Database Tables

### Core Tables

#### `profiles`

User profile information.

```typescript
interface Profile {
  id: string;                    // UUID
  user_id: string;               // References auth.users
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  bio: string | null;
  role: 'user' | 'moderator' | 'admin' | 'super_admin';
  created_at: string;
  updated_at: string;
}
```

**Common Queries:**

```typescript
// Get current user profile
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .single();

// Update profile
const { error } = await supabase
  .from('profiles')
  .update({ full_name: 'New Name' })
  .eq('user_id', userId);
```

---

#### `community_posts`

Community feed posts.

```typescript
interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  title: string | null;
  image_urls: string[];
  video_url: string | null;
  video_thumbnail_url: string | null;
  tags: string[];
  location: string | null;
  location_scope: 'neighborhood' | 'city' | 'state' | 'all';
  post_type: string;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  rsvp_enabled: boolean;
  created_at: string;
  updated_at: string;
}
```

**Common Queries:**

```typescript
// Fetch feed with author info
const { data } = await supabase
  .from('community_posts')
  .select(`
    *,
    profiles!user_id (
      full_name,
      avatar_url,
      city,
      state
    )
  `)
  .order('created_at', { ascending: false })
  .limit(20);

// Create post
const { data, error } = await supabase
  .from('community_posts')
  .insert({
    user_id: userId,
    content: 'Hello neighbors!',
    location_scope: 'neighborhood'
  })
  .select()
  .single();
```

---

#### `direct_messages`

Private messages between users.

```typescript
interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  conversation_id: string;
  content: string;
  attachments: any[];
  is_read: boolean;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
}
```

**Common Queries:**

```typescript
// Fetch conversation messages
const { data } = await supabase
  .from('direct_messages')
  .select('*')
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: true });

// Send message
const { data, error } = await supabase
  .from('direct_messages')
  .insert({
    sender_id: userId,
    recipient_id: recipientId,
    conversation_id: conversationId,
    content: 'Hello!'
  })
  .select()
  .single();

// Mark as read
const { error } = await supabase
  .from('direct_messages')
  .update({ is_read: true, read_at: new Date().toISOString() })
  .eq('conversation_id', conversationId)
  .eq('recipient_id', userId)
  .is('read_at', null);
```

---

#### `safety_alerts`

Community safety alerts.

```typescript
interface SafetyAlert {
  id: string;
  user_id: string;
  title: string;
  description: string;
  alert_type: 'crime' | 'fire' | 'weather' | 'health' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}
```

---

#### `panic_alerts`

Emergency panic button alerts.

```typescript
interface PanicAlert {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  address: string | null;
  status: 'active' | 'acknowledged' | 'responding' | 'resolved';
  alert_message: string | null;
  created_at: string;
  resolved_at: string | null;
}
```

---

### Business Tables

#### `businesses`

Business profiles.

```typescript
interface Business {
  id: string;
  user_id: string;
  business_name: string;
  category: string;
  description: string | null;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  physical_address: string | null;
  city: string | null;
  state: string | null;
  website_url: string | null;
  operating_hours: Json;
  is_verified: boolean;
  rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}
```

---

#### `services`

Services offered by businesses/individuals.

```typescript
interface Service {
  id: string;
  user_id: string;
  business_id: string | null;
  title: string;
  description: string;
  category: string;
  price: number | null;
  price_type: 'fixed' | 'hourly' | 'negotiable';
  images: string[];
  is_active: boolean;
  created_at: string;
}
```

---

#### `marketplace_items`

Marketplace listings.

```typescript
interface MarketplaceItem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  images: string[];
  location: string;
  is_sold: boolean;
  is_negotiable: boolean;
  created_at: string;
}
```

---

### Advertising Tables

#### `advertisement_campaigns`

Ad campaigns.

```typescript
interface AdvertisementCampaign {
  id: string;
  user_id: string;
  campaign_name: string;
  campaign_type: 'post' | 'service' | 'business' | 'event' | 'marketplace';
  status: 'draft' | 'pending' | 'active' | 'paused' | 'completed';
  approval_status: 'pending' | 'approved' | 'rejected';
  pricing_tier_id: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  daily_budget: number;
  total_impressions: number;
  total_clicks: number;
  total_spent: number;
  target_geographic_scope: 'neighborhood' | 'city' | 'state' | 'national';
  target_cities: string[];
  target_states: string[];
  ad_title: string;
  ad_description: string;
  ad_images: Json;
  ad_url: string | null;
  payment_status: 'pending' | 'completed' | 'failed';
  created_at: string;
}
```

---

## Real-time Subscriptions

### Message Subscription

```typescript
const channel = supabase
  .channel(`messages:${conversationId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'direct_messages',
      filter: `conversation_id=eq.${conversationId}`
    },
    (payload) => {
      console.log('New message:', payload.new);
    }
  )
  .subscribe();

// Cleanup
channel.unsubscribe();
```

### Notification Subscription

```typescript
const channel = supabase
  .channel(`notifications:${userId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'alert_notifications',
      filter: `recipient_id=eq.${userId}`
    },
    (payload) => {
      console.log('New notification:', payload.new);
    }
  )
  .subscribe();
```

### Presence (Online Status)

```typescript
const channel = supabase.channel('online-users');

channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    console.log('Online users:', Object.keys(state));
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User joined:', key);
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('User left:', key);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user_id: userId,
        online_at: new Date().toISOString()
      });
    }
  });
```

---

## Storage Buckets

### Available Buckets

| Bucket | Purpose | Public |
|--------|---------|--------|
| `avatars` | User profile pictures | Yes |
| `post-images` | Community post images | Yes |
| `documents` | User documents | No |
| `business-assets` | Business logos/images | Yes |

### Upload File

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.jpg`, file, {
    cacheControl: '3600',
    upsert: true
  });

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.jpg`);
```

### Delete File

```typescript
const { error } = await supabase.storage
  .from('avatars')
  .remove([`${userId}/avatar.jpg`]);
```

---

## Error Handling

### Standard Error Response

```typescript
interface SupabaseError {
  message: string;
  details: string | null;
  hint: string | null;
  code: string;
}
```

### Common Error Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| `PGRST301` | Row not found | Check if resource exists |
| `PGRST204` | Column not found | Verify column name |
| `23505` | Unique violation | Resource already exists |
| `23503` | Foreign key violation | Referenced resource missing |
| `42501` | RLS policy violation | Check user permissions |
| `JWT expired` | Token expired | Refresh session |

### Error Handling Pattern

```typescript
const { data, error } = await supabase
  .from('table')
  .select('*');

if (error) {
  if (error.code === '42501') {
    // Permission denied - redirect to login
    navigate('/login');
  } else if (error.code === '23505') {
    // Duplicate - show user-friendly message
    toast.error('This item already exists');
  } else {
    // Generic error
    console.error('Database error:', error);
    toast.error('Something went wrong');
  }
  return;
}

// Success - use data
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Auth endpoints | 30 req/min |
| Database queries | 1000 req/min |
| Edge functions | 500 req/min |
| Storage uploads | 100 req/min |

---

## Next Steps

- [Architecture Overview](./ARCHITECTURE.md)
- [Component Hierarchy](./COMPONENT_HIERARCHY.md)
- [Database Schema](./DATABASE_SCHEMA.md)
