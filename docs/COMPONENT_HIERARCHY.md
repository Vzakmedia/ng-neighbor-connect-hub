# NeighborLink Component Hierarchy

## Table of Contents

1. [Overview](#overview)
2. [Application Structure](#application-structure)
3. [Page Components](#page-components)
4. [Feature Components](#feature-components)
5. [UI Components](#ui-components)
6. [Hooks Architecture](#hooks-architecture)
7. [State Management](#state-management)

---

## Overview

NeighborLink follows a component-based architecture with clear separation of concerns:

- **Pages**: Route-level components
- **Features**: Business logic components
- **UI**: Reusable presentation components
- **Hooks**: Shared stateful logic
- **Stores**: Global state management

---

## Application Structure

```
App
├── PlatformRouter (HashRouter for native, BrowserRouter for web)
│   ├── AuthProvider
│   │   ├── QueryClientProvider (React Query)
│   │   │   ├── TooltipProvider
│   │   │   │   ├── OfflineModeBanner
│   │   │   │   ├── SyncStatusIndicator
│   │   │   │   ├── Routes
│   │   │   │   │   ├── PublicRoutes
│   │   │   │   │   └── ProtectedRoutes
│   │   │   │   ├── Toaster (Sonner)
│   │   │   │   └── ReactQueryDevtools
```

---

## Page Components

### Public Pages

```
src/pages/
├── Index.tsx                    # Landing page (unauthenticated)
├── Login.tsx                    # Login form
├── Signup.tsx                   # Registration form
├── AuthCallback.tsx             # OAuth callback handler
├── ForgotPassword.tsx           # Password reset request
├── ResetPassword.tsx            # Password reset form
├── Blog.tsx                     # Public blog
├── BlogPost.tsx                 # Individual blog post
├── Enterprise.tsx               # Enterprise API landing
├── Terms.tsx                    # Terms of service
└── Privacy.tsx                  # Privacy policy
```

### Protected Pages (Require Auth)

```
src/pages/
├── Home.tsx                     # Main dashboard
│   └── HomeDashboard
│       ├── HeroSection
│       ├── TrendingPostsCarousel
│       ├── FeedTabNavigation
│       └── CommunityFeed
│
├── Community.tsx                # Community hub
│   └── CommunityLayout
│       ├── CommunityFeed
│       ├── CommunityPost
│       └── CreatePostDialog
│
├── Messages.tsx                 # Messaging center
│   └── MessagingLayout
│       ├── ConversationList
│       ├── MessageThread
│       └── MessageComposer
│
├── Notifications.tsx            # Notification center
│   └── NotificationsList
│       ├── NotificationCard
│       └── NotificationFilters
│
├── Safety.tsx                   # Safety features
│   └── SafetyDashboard
│       ├── PanicButton
│       ├── EmergencyContacts
│       └── SafetyAlerts
│
├── Profile.tsx                  # User profile
│   └── ProfileLayout
│       ├── ProfileHeader
│       ├── ProfileTabs
│       └── ProfileSettings
│
├── Settings.tsx                 # App settings
│   └── SettingsLayout
│       ├── AccountSettings
│       ├── PrivacySettings
│       ├── NotificationSettings
│       └── SecuritySettings
│
├── Marketplace.tsx              # Buy/sell items
│   └── MarketplaceLayout
│       ├── ItemGrid
│       ├── ItemCard
│       └── ListItemDialog
│
├── Services.tsx                 # Service directory
│   └── ServicesLayout
│       ├── ServiceGrid
│       ├── ServiceCard
│       └── ServiceDetails
│
├── Events.tsx                   # Community events
│   └── EventsLayout
│       ├── EventCalendar
│       ├── EventCard
│       └── CreateEventDialog
│
└── Boards.tsx                   # Discussion boards
    └── BoardsLayout
        ├── BoardList
        ├── BoardView
        └── BoardPost
```

### Admin Pages

```
src/pages/admin/
├── AdminDashboard.tsx           # Admin home
│   └── AdminLayout
│       ├── AdminSidebar
│       ├── AdminStats
│       └── AdminCharts
│
├── UserManagement.tsx           # User admin
│   └── UserTable
│       ├── UserRow
│       └── UserActions
│
├── ContentModeration.tsx        # Content review
│   └── ModerationQueue
│       ├── ContentCard
│       └── ModerationActions
│
├── AdvertisingAdmin.tsx         # Ad management
│   └── CampaignTable
│       ├── CampaignRow
│       └── ApprovalDialog
│
├── SecurityLogs.tsx             # Security audit
│   └── AuditTable
│       └── LogEntry
│
└── SystemSettings.tsx           # Platform config
    └── SettingsForm
```

---

## Feature Components

### Community Features

```
src/components/community/
├── feed/
│   ├── CommunityFeed.tsx        # Main feed container
│   ├── FeedFilters.tsx          # Filter controls
│   ├── FeedTabNavigation.tsx    # Tab switcher
│   └── PostSkeleton.tsx         # Loading state
│
├── post/
│   ├── PostCard.tsx             # Post display card
│   ├── PostHeader.tsx           # Author info + menu
│   ├── PostContent.tsx          # Text + media
│   ├── PostActions.tsx          # Like/comment/share
│   ├── PostComments.tsx         # Comments section
│   └── PostOptionsMenu.tsx      # Edit/delete/report
│
├── CreatePostDialog.tsx         # New post modal
├── EditPostDialog.tsx           # Edit post modal
└── SharePostDialog.tsx          # Share modal
```

### Messaging Features

```
src/components/messaging/
├── ConversationList.tsx         # Sidebar list
├── ConversationItem.tsx         # List item
├── MessageThread.tsx            # Message display
├── MessageBubble.tsx            # Single message
├── MessageComposer.tsx          # Input + send
├── MessageStatus.tsx            # Delivery status
├── TypingIndicator.tsx          # "User is typing..."
├── CallButton.tsx               # Audio/video call
└── VoiceCallModal.tsx           # Active call UI
```

### Safety Features

```
src/components/safety/
├── PanicButton.tsx              # Emergency trigger
├── PanicButtonWidget.tsx        # Floating button
├── EmergencyContacts.tsx        # Contact list
├── EmergencyContactCard.tsx     # Contact display
├── AddEmergencyContact.tsx      # Add contact form
├── SafetyAlerts.tsx             # Alert list
├── SafetyAlertCard.tsx          # Alert display
└── CreateAlertDialog.tsx        # New alert form
```

### Business Features

```
src/components/business/
├── BusinessCard.tsx             # Business display
├── BusinessProfile.tsx          # Full profile
├── BusinessForm.tsx             # Create/edit
├── ServiceCard.tsx              # Service display
├── ServiceForm.tsx              # Create/edit
├── ReviewCard.tsx               # Review display
├── ReviewForm.tsx               # Submit review
└── BookingForm.tsx              # Book service
```

### Advertising Features

```
src/components/advertising/
├── display/
│   ├── AdDisplay.tsx            # Ad renderer
│   ├── AdCard.tsx               # Ad card style
│   └── AdBanner.tsx             # Banner style
│
├── create/
│   ├── CreateCampaignWizard.tsx # Campaign wizard
│   ├── TargetingStep.tsx        # Audience targeting
│   ├── BudgetStep.tsx           # Budget config
│   ├── CreativeStep.tsx         # Ad creative
│   └── ReviewStep.tsx           # Final review
│
└── analytics/
    ├── CampaignAnalytics.tsx    # Performance view
    ├── MetricsCard.tsx          # Metric display
    └── PerformanceChart.tsx     # Charts
```

---

## UI Components

### Base Components (shadcn/ui)

```
src/components/ui/
├── accordion.tsx
├── alert-dialog.tsx
├── alert.tsx
├── aspect-ratio.tsx
├── avatar.tsx
├── badge.tsx
├── button.tsx
├── calendar.tsx
├── card.tsx
├── carousel.tsx
├── chart.tsx
├── checkbox.tsx
├── collapsible.tsx
├── command.tsx
├── context-menu.tsx
├── dialog.tsx
├── drawer.tsx
├── dropdown-menu.tsx
├── form.tsx
├── hover-card.tsx
├── input-otp.tsx
├── input.tsx
├── label.tsx
├── menubar.tsx
├── navigation-menu.tsx
├── pagination.tsx
├── popover.tsx
├── progress.tsx
├── radio-group.tsx
├── resizable.tsx
├── scroll-area.tsx
├── select.tsx
├── separator.tsx
├── sheet.tsx
├── sidebar.tsx
├── skeleton.tsx
├── slider.tsx
├── sonner.tsx
├── switch.tsx
├── table.tsx
├── tabs.tsx
├── textarea.tsx
├── toast.tsx
├── toaster.tsx
├── toggle-group.tsx
├── toggle.tsx
└── tooltip.tsx
```

### Custom UI Components

```
src/components/
├── layout/
│   ├── AppLayout.tsx            # Main layout wrapper
│   ├── Navbar.tsx               # Top navigation
│   ├── MobileNav.tsx            # Mobile bottom nav
│   ├── Sidebar.tsx              # Desktop sidebar
│   └── Footer.tsx               # Page footer
│
├── common/
│   ├── Avatar.tsx               # User avatar
│   ├── LoadingSpinner.tsx       # Loading state
│   ├── EmptyState.tsx           # No data state
│   ├── ErrorBoundary.tsx        # Error handling
│   ├── InfiniteScroll.tsx       # Infinite scroll
│   ├── ImageUpload.tsx          # Image picker
│   ├── LocationPicker.tsx       # Location input
│   ├── DateTimePicker.tsx       # Date/time input
│   └── RichTextEditor.tsx       # WYSIWYG editor
│
└── mobile/
    ├── OfflineModeBanner.tsx    # Offline indicator
    ├── SyncStatusIndicator.tsx  # Sync status
    ├── OfflineBadge.tsx         # Cache indicator
    ├── PullToRefresh.tsx        # Pull refresh
    ├── ConnectionStatusIndicator.tsx
    └── NativeSplash.tsx         # Splash screen
```

---

## Hooks Architecture

### Authentication Hooks

```
src/hooks/
├── useAuth.ts                   # Auth state & methods
├── useProfile.ts                # Current user profile
├── useProfileQuery.ts           # React Query profile
├── useSession.ts                # Session management
└── useAdminAuth.ts              # Admin role check
```

### Data Fetching Hooks

```
src/hooks/
├── useFeedQuery.ts              # Feed with infinite scroll
├── useConversationsQuery.ts     # Conversations list
├── useEmergencyContactsQuery.ts # Emergency contacts
├── useNotifications.ts          # Notifications
├── useMessages.ts               # Message thread
└── useEvents.ts                 # Events list
```

### Community Hooks

```
src/hooks/community/
├── usePostEngagement.ts         # Like/save/share
├── useComments.ts               # Comment CRUD
├── usePostMutations.ts          # Create/edit/delete
└── useFeedFilters.ts            # Filter state
```

### Mobile Hooks

```
src/hooks/mobile/
├── useNativeNetwork.ts          # Network status
├── useNativeStorage.ts          # Capacitor storage
├── useBiometricAuth.ts          # Biometric login
├── usePushNotifications.ts      # Push notifications
├── useGeolocation.ts            # GPS location
├── useBackgroundSync.ts         # Offline sync
├── useBatteryStatus.ts          # Battery aware
└── useOfflineQueue.ts           # Action queue
```

### Offline Hooks

```
src/hooks/
├── useOfflineActions.ts         # Unified action queue
├── useOfflinePostDraft.ts       # Offline post drafts
└── useOnlineStatus.ts           # Online detection
```

### Utility Hooks

```
src/hooks/
├── useToast.ts                  # Toast notifications
├── useMediaQuery.ts             # Responsive breakpoints
├── useDebounce.ts               # Debounced values
├── useKeyboardShortcuts.ts      # Keyboard handlers
├── useLocalStorage.ts           # Persistent state
└── useClickOutside.ts           # Click detection
```

---

## State Management

### Zustand Stores

```
src/stores/
├── notificationStore.ts         # Notification state
│   ├── unreadCount: number
│   ├── notifications: Notification[]
│   ├── markAsRead: (id) => void
│   └── addNotification: (n) => void
│
├── audioStore.ts                # Audio settings
│   ├── enabled: boolean
│   ├── volume: number
│   ├── toggleAudio: () => void
│   └── setVolume: (v) => void
│
├── presenceStore.ts             # Online presence
│   ├── onlineUsers: Map<string, UserPresence>
│   ├── trackUser: (id, status) => void
│   └── isOnline: (id) => boolean
│
├── callStore.ts                 # Call state
│   ├── activeCall: Call | null
│   ├── incomingCall: Call | null
│   ├── startCall: (userId) => void
│   └── endCall: () => void
│
└── offlineSyncStore.ts          # Sync queue
    ├── pendingActions: Action[]
    ├── addAction: (action) => void
    ├── removeAction: (id) => void
    └── processQueue: () => Promise
```

### React Query Keys

```typescript
// Standardized query key patterns
const queryKeys = {
  // User
  profile: (userId: string) => ['profile', userId],
  
  // Feed
  feed: (filters: FeedFilters) => ['feed', filters],
  post: (postId: string) => ['post', postId],
  comments: (postId: string) => ['comments', postId],
  
  // Messaging
  conversations: (userId: string) => ['conversations', userId],
  messages: (conversationId: string) => ['messages', conversationId],
  
  // Notifications
  notifications: (userId: string) => ['notifications', userId],
  unreadCount: (userId: string) => ['notifications', 'unread', userId],
  
  // Safety
  emergencyContacts: (userId: string) => ['emergency-contacts', userId],
  safetyAlerts: (filters: AlertFilters) => ['safety-alerts', filters],
  
  // Business
  services: (filters: ServiceFilters) => ['services', filters],
  marketplace: (filters: MarketplaceFilters) => ['marketplace', filters],
  events: (filters: EventFilters) => ['events', filters],
};
```

---

## Component Patterns

### Container/Presenter Pattern

```typescript
// Container: handles data & logic
const PostListContainer = () => {
  const { data, isLoading } = useFeedQuery();
  const { handleLike } = usePostEngagement();
  
  if (isLoading) return <PostListSkeleton />;
  
  return <PostList posts={data} onLike={handleLike} />;
};

// Presenter: handles display only
const PostList = ({ posts, onLike }) => (
  <div className="space-y-4">
    {posts.map(post => (
      <PostCard key={post.id} post={post} onLike={onLike} />
    ))}
  </div>
);
```

### Compound Component Pattern

```typescript
// Card compound component
<Card>
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Description>Description</Card.Description>
  </Card.Header>
  <Card.Content>
    Content here
  </Card.Content>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>
```

### Render Props Pattern

```typescript
// Infinite scroll with render props
<InfiniteScroll
  queryKey={['feed']}
  queryFn={fetchFeed}
  renderItem={(post) => <PostCard post={post} />}
  renderLoading={() => <PostSkeleton />}
  renderEmpty={() => <EmptyState message="No posts yet" />}
/>
```

### HOC Pattern

```typescript
// Protected route wrapper
const withAuth = (Component) => {
  return (props) => {
    const { user, isLoading } = useAuth();
    
    if (isLoading) return <LoadingSpinner />;
    if (!user) return <Navigate to="/login" />;
    
    return <Component {...props} />;
  };
};

export default withAuth(ProtectedPage);
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `PostCard.tsx` |
| Hooks | camelCase, use prefix | `usePostEngagement.ts` |
| Utils | camelCase | `formatDate.ts` |
| Types | PascalCase | `Community.types.ts` |
| Stores | camelCase, Store suffix | `notificationStore.ts` |
| Pages | PascalCase | `Home.tsx` |

---

## Import Organization

```typescript
// 1. External imports
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// 2. Internal absolute imports
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// 3. Relative imports
import { PostCard } from './PostCard';
import type { Post } from './types';

// 4. Style imports (if any)
import './styles.css';
```

---

## Next Steps

- [Architecture Overview](./ARCHITECTURE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Database Schema](./DATABASE_SCHEMA.md)
