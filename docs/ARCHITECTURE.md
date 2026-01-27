# NeighborLink App Architecture

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Data Flow](#data-flow)
5. [Security Architecture](#security-architecture)
6. [Performance Optimizations](#performance-optimizations)

---

## Overview

NeighborLink is a production-grade community engagement platform built with a modern React frontend and Supabase backend. The application supports web browsers and native mobile platforms (iOS/Android) through Capacitor.

### Key Characteristics

- **Multi-platform**: Web + iOS + Android from single codebase
- **Real-time**: WebSocket-based live updates for messages, notifications, alerts
- **Offline-first**: Comprehensive caching and sync for mobile reliability
- **Scalable**: Edge functions for compute, CDN for static assets, connection pooling for database

---

## Technology Stack

### Frontend

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | React 18 | Component-based UI |
| Language | TypeScript | Type safety |
| Build Tool | Vite | Fast development & optimized builds |
| Styling | Tailwind CSS | Utility-first CSS |
| Components | shadcn/ui | Accessible component primitives |
| Animation | Framer Motion | Declarative animations |
| State | Zustand + React Query | Global state + server state |
| Routing | React Router v6 | Client-side routing |
| Forms | React Hook Form + Zod | Form handling + validation |

### Backend (Supabase)

| Service | Purpose |
|---------|---------|
| PostgreSQL | Primary database with RLS |
| Auth | User authentication (email, OAuth) |
| Realtime | WebSocket subscriptions |
| Storage | File uploads (images, documents) |
| Edge Functions | Serverless compute (Deno) |

### Native Mobile (Capacitor)

| Plugin | Purpose |
|--------|---------|
| @capacitor/core | Core native bridge |
| @capacitor/camera | Photo capture |
| @capacitor/geolocation | GPS location |
| @capacitor/push-notifications | Push notifications |
| @capacitor/preferences | Native key-value storage |
| @aparajita/capacitor-biometric-auth | Biometric login |

### External Integrations

| Service | Purpose |
|---------|---------|
| Stripe | Payment processing |
| Cloudinary | Media optimization & CDN |
| Resend | Transactional email |
| Google Maps | Location services |
| Firebase Cloud Messaging | Push notifications |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   Web App   │  │  iOS App    │  │ Android App │                  │
│  │   (React)   │  │ (Capacitor) │  │ (Capacitor) │                  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │
│         │                │                │                          │
│         └────────────────┼────────────────┘                          │
│                          ▼                                           │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    React Application                           │  │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────────────┐ │  │
│  │  │ Router  │  │ Zustand  │  │ React   │  │ Supabase Client  │ │  │
│  │  │         │  │ Stores   │  │ Query   │  │                  │ │  │
│  │  └─────────┘  └──────────┘  └─────────┘  └──────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPABASE LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │    Auth     │  │  Realtime   │  │   Storage   │  │   Edge     │  │
│  │   Service   │  │  WebSocket  │  │   Buckets   │  │ Functions  │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘  │
│         │                │                │                │         │
│         └────────────────┼────────────────┼────────────────┘         │
│                          ▼                ▼                          │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     PostgreSQL Database                        │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │              Row Level Security (RLS)                    │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │   Stripe    │  │ Cloudinary  │  │   Resend    │  │   Google   │  │
│  │  Payments   │  │    Media    │  │   Email     │  │    Maps    │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Authentication Flow

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│  User    │────▶│  Auth Form   │────▶│  Supabase   │────▶│  Session │
│  Action  │     │  Component   │     │    Auth     │     │  Store   │
└──────────┘     └──────────────┘     └─────────────┘     └──────────┘
                                              │
                                              ▼
                                      ┌─────────────┐
                                      │   Profile   │
                                      │   Created   │
                                      │ (via trigger)│
                                      └─────────────┘
```

### Real-time Updates Flow

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐
│  User A  │────▶│  Insert/     │────▶│  PostgreSQL │
│  Action  │     │  Update      │     │   Table     │
└──────────┘     └──────────────┘     └──────┬──────┘
                                              │
                                              ▼
                                      ┌─────────────┐
                                      │  Realtime   │
                                      │  Broadcast  │
                                      └──────┬──────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
            ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
            │   User B    │           │   User C    │           │   User D    │
            │ (subscribed)│           │ (subscribed)│           │ (subscribed)│
            └─────────────┘           └─────────────┘           └─────────────┘
```

### Offline Sync Flow

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐
│  User    │────▶│  Action      │────▶│  Online?    │
│  Action  │     │  Handler     │     │             │
└──────────┘     └──────────────┘     └──────┬──────┘
                                              │
                        ┌─────────────────────┼─────────────────────┐
                        ▼ YES                                       ▼ NO
                ┌─────────────┐                             ┌─────────────┐
                │  Execute    │                             │  Queue to   │
                │  Immediately│                             │  Sync Store │
                └─────────────┘                             └──────┬──────┘
                                                                   │
                                                                   ▼
                                                           ┌─────────────┐
                                                           │  Optimistic │
                                                           │  UI Update  │
                                                           └──────┬──────┘
                                                                   │
                                                    (When online)  ▼
                                                           ┌─────────────┐
                                                           │  Background │
                                                           │    Sync     │
                                                           └─────────────┘
```

---

## Security Architecture

### Row Level Security (RLS)

All tables enforce RLS policies. Key patterns:

```sql
-- Users can only read their own data
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only modify their own data
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Public read, authenticated write
CREATE POLICY "Public posts are viewable by everyone"
  ON community_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Role-Based Access Control (RBAC)

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER ROLES                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  super_admin ─────┬───▶ All permissions                         │
│                   │                                              │
│  admin ───────────┼───▶ User management, content moderation     │
│                   │                                              │
│  moderator ───────┼───▶ Content moderation only                 │
│                   │                                              │
│  manager ─────────┼───▶ Business management                     │
│                   │                                              │
│  support ─────────┼───▶ Support ticket handling                 │
│                   │                                              │
│  user ────────────┴───▶ Standard user permissions               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Methods

| Method | Implementation |
|--------|----------------|
| Email/Password | Supabase Auth with email verification |
| Google OAuth | OAuth 2.0 via Supabase |
| Magic Link | Passwordless email authentication |
| Biometric | Native biometric via Capacitor (iOS/Android) |

---

## Performance Optimizations

### Database Optimizations

1. **Denormalized Counts**: `likes_count`, `comments_count`, `saves_count` on `community_posts` with triggers
2. **Composite Indexes**: On frequent query patterns (`user_id + created_at`)
3. **GIN Indexes**: On JSONB columns and arrays
4. **Estimated Counts**: `get_estimated_count()` function for admin dashboards

### Frontend Optimizations

1. **Code Splitting**: Route-based lazy loading
2. **React Query Caching**: Stale-while-revalidate pattern
3. **Virtualization**: `@tanstack/react-virtual` for long lists
4. **Image Optimization**: Cloudinary transformations
5. **Prefetching**: Strategic data prefetching on hover/focus

### Caching Strategy

| Layer | TTL | Purpose |
|-------|-----|---------|
| React Query | 30s - 24h | UI state cache |
| Service Worker | 24h | Static assets |
| Capacitor Preferences | Indefinite | Critical offline data |
| API Cache (SW) | 5min - 1h | API response cache |

### Bundle Optimization

- Tree shaking enabled
- Dynamic imports for heavy components
- Shared chunks for common dependencies
- Gzip/Brotli compression

---

## Directory Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui primitives
│   ├── community/      # Community feature components
│   ├── messaging/      # Messaging components
│   ├── mobile/         # Mobile-specific components
│   └── admin/          # Admin dashboard components
├── hooks/              # Custom React hooks
│   ├── mobile/         # Mobile-specific hooks
│   └── community/      # Community feature hooks
├── pages/              # Route components
├── lib/                # Utility functions
├── services/           # Business logic services
├── stores/             # Zustand stores
├── types/              # TypeScript type definitions
├── integrations/       # Third-party integrations
│   └── supabase/       # Supabase client & types
└── assets/             # Static assets

supabase/
├── functions/          # Edge functions
└── migrations/         # Database migrations

public/
├── sw.js              # Service worker
└── manifest.json      # PWA manifest
```

---

## Next Steps

- [API Documentation](./API_DOCUMENTATION.md)
- [Component Hierarchy](./COMPONENT_HIERARCHY.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Deployment Guide](./DEPLOYMENT.md)
