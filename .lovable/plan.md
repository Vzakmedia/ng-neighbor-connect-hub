
# Offline Support and Data Persistence for NeighborLink Mobile App

## Executive Summary

This plan enhances the NeighborLink mobile app with comprehensive offline capabilities, allowing users to access previously loaded content, queue actions for later sync, and seamlessly transition between online and offline states. The implementation builds upon the existing React Query caching infrastructure, Capacitor native storage, and background sync mechanisms already in place.

---

## Current State Analysis

### What Already Exists

| Feature | Status | Location |
|---------|--------|----------|
| React Query with localStorage persistence | Partial (feed only) | `src/main.tsx:341-372` |
| Native storage adapter (Capacitor Preferences) | Complete | `src/utils/nativeSyncStorage.ts`, `src/hooks/mobile/useNativeStorage.ts` |
| Offline queue for HTTP requests | Exists but unused | `src/hooks/mobile/useOfflineQueue.ts` |
| Background sync with battery awareness | Exists but incomplete | `src/hooks/mobile/useBackgroundSync.ts` |
| Message queue with retry logic | Complete for DMs | `src/hooks/useMessageQueue.tsx` |
| Network status detection | Complete | `src/hooks/mobile/useNativeNetwork.ts` |
| Connection status UI indicators | Complete | `src/components/mobile/ConnectionStatusIndicator.tsx` |
| Service worker with caching strategies | Basic implementation | `public/sw.js` |
| Optimistic updates | Partial (likes, messages) | `src/hooks/useFeedQuery.ts`, `src/hooks/useDirectMessages.tsx` |

### Gaps to Address

1. **Limited React Query Persistence**: Only `feed` queries are persisted; profile, conversations, notifications, events, and marketplace data are not
2. **No Offline Data Access UI**: Users have no indication of which content is available offline
3. **Incomplete Sync Queue Integration**: `useBackgroundSync` has a placeholder `processOperation` that throws an error
4. **No Offline Post Creation**: Users cannot draft posts while offline
5. **Limited Service Worker API Caching**: Service worker skips all Supabase API calls
6. **No Sync Status Indicator**: Users don't know when pending changes will sync

---

## Implementation Plan

### Phase 1: Enhanced React Query Persistence (Core)

**Goal**: Persist all essential data types to enable offline browsing

#### 1.1 Expand Query Persistence Configuration

Update `src/main.tsx` to persist additional query types:

```text
Currently persisted:
- feed (first 2 pages)

Will add:
- profile (user's own profile)
- conversations (last 20 conversations)
- notifications (last 50 notifications)
- events (upcoming events in user's area)
- marketplace (recent listings)
- emergency-contacts (critical for safety features)
- saved-posts (user's bookmarked content)
```

**Technical approach**:
- Modify `shouldDehydrateQuery` in `main.tsx` to include additional query keys
- Apply size limits per query type to prevent localStorage quota exhaustion
- Add serialization optimization to strip non-essential nested data

#### 1.2 Create Native-Aware Persister

Create `src/utils/nativeQueryPersister.ts`:

- Uses Capacitor Preferences on native platforms (larger storage quota than localStorage)
- Falls back to localStorage on web
- Implements chunked storage for large datasets (Preferences has per-key size limits)
- Adds compression for large payloads using lightweight LZ-String compression

---

### Phase 2: Offline-First Data Hooks

**Goal**: Convert critical hooks to use React Query with offline support

#### 2.1 Convert `useProfile` to React Query

Create `src/hooks/useProfileQuery.ts`:

```typescript
// Current: useState + useEffect (no persistence)
// New: useQuery with persistence and stale-while-revalidate
export function useProfileQuery() {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000,    // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    networkMode: 'offlineFirst',
    placeholderData: previousData,
  });
}
```

**Benefits**:
- Profile data available immediately on app launch from cache
- Automatic background refresh when online
- Optimistic updates for profile edits

#### 2.2 Convert `useConversations` to React Query

Create `src/hooks/useConversationsQuery.ts`:

- Persist last 20 conversations with last message preview
- Enable offline viewing of conversation list
- Integrate with existing message cache for thread content

#### 2.3 Add Emergency Contacts Caching

Critical for the panic button feature to work offline:

```typescript
// Must be available offline for emergency situations
queryKey: ['emergency-contacts', userId]
// Persist indefinitely, refresh on each online session
```

---

### Phase 3: Offline Action Queue System

**Goal**: Allow users to perform actions while offline that sync when connectivity returns

#### 3.1 Complete Background Sync Implementation

Update `src/hooks/mobile/useBackgroundSync.ts`:

```typescript
// Current: processOperation throws "must be implemented"
// New: Full implementation with operation handlers

const operationHandlers = {
  post: async (data) => {
    const { error } = await supabase.from('community_posts').insert(data);
    if (error) throw error;
  },
  message: async (data) => {
    const { error } = await supabase.from('direct_messages').insert(data);
    if (error) throw error;
  },
  like: async (data) => {
    // Handle like/unlike
  },
  save: async (data) => {
    // Handle save/unsave
  },
  // ... additional operation types
};
```

#### 3.2 Create Unified Offline Actions Hook

Create `src/hooks/useOfflineActions.ts`:

```typescript
export function useOfflineActions() {
  const { isOnline } = useNativeNetwork();
  const { addToQueue, queue, isProcessing } = useBackgroundSync();

  const performAction = async (type, data, onlineAction) => {
    if (isOnline) {
      // Execute immediately
      return onlineAction();
    } else {
      // Queue for later
      addToQueue(type, data);
      // Return optimistic success
      return { queued: true };
    }
  };

  return { performAction, pendingActions: queue, isProcessing };
}
```

#### 3.3 Offline Post Creation

Create `src/hooks/useOfflinePostDraft.ts`:

- Store draft posts in native storage
- Add "drafts" indicator in UI
- Auto-submit drafts when back online
- Support for offline image selection (store as base64 temporarily, upload on sync)

---

### Phase 4: Offline UI Indicators

**Goal**: Inform users about offline state and available content

#### 4.1 Create Offline Mode Banner

Create `src/components/mobile/OfflineModeBanner.tsx`:

```typescript
// Shows when offline with:
// - "You're offline" message
// - Pending sync count badge
// - "Viewing cached content" subtitle
// - Manual sync button (disabled until online)
```

#### 4.2 Create Sync Status Indicator

Create `src/components/mobile/SyncStatusIndicator.tsx`:

- Floating indicator showing pending sync items
- Animates during active sync
- Shows success/failure feedback
- Tap to expand and see queue details

#### 4.3 Add Offline Availability Badges

Update feed and content cards to show:
- "Available offline" badge for cached content
- "Cached X hours ago" timestamp
- Visual dimming for content that may be stale

---

### Phase 5: Enhanced Service Worker Caching

**Goal**: Cache API responses for true offline capability

#### 5.1 Update Service Worker for API Caching

Modify `public/sw.js`:

```javascript
// Current: Skips all Supabase API calls
// New: Selective caching for read-only endpoints

const API_CACHE = 'api-v1';
const CACHEABLE_ENDPOINTS = [
  '/rest/v1/community_posts',
  '/rest/v1/profiles',
  '/rest/v1/events',
  '/rest/v1/businesses',
  '/rest/v1/marketplace_listings',
];

// Cache GET requests to these endpoints
// Use stale-while-revalidate strategy
```

#### 5.2 Implement Cache Versioning

- Add cache version management
- Clear stale API caches on app update
- Maintain separate caches for different data types with different TTLs

---

### Phase 6: Data Prioritization and Storage Management

**Goal**: Manage storage quota intelligently

#### 6.1 Create Storage Manager

Create `src/services/offlineStorageManager.ts`:

```typescript
export const offlineStorageManager = {
  // Priority levels for cached data
  PRIORITIES: {
    CRITICAL: ['emergency-contacts', 'profile', 'auth'],
    HIGH: ['conversations', 'notifications'],
    MEDIUM: ['feed', 'events'],
    LOW: ['marketplace', 'businesses'],
  },

  // Estimate storage usage
  async getStorageUsage(): Promise<StorageStats>,

  // Clear low-priority data when approaching quota
  async pruneStorage(): Promise<void>,

  // Export all user data
  async exportOfflineData(): Promise<Blob>,
};
```

#### 6.2 Implement Storage Quota Monitoring

- Monitor available storage space
- Warn users when approaching limits
- Auto-prune low-priority cached data
- Provide manual "clear cache" option in settings

---

## File Changes Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `src/utils/nativeQueryPersister.ts` | Capacitor-aware React Query persister |
| `src/hooks/useProfileQuery.ts` | React Query version of profile hook |
| `src/hooks/useConversationsQuery.ts` | React Query version of conversations hook |
| `src/hooks/useOfflineActions.ts` | Unified offline action queue |
| `src/hooks/useOfflinePostDraft.ts` | Offline post drafting |
| `src/components/mobile/OfflineModeBanner.tsx` | Offline state indicator |
| `src/components/mobile/SyncStatusIndicator.tsx` | Pending sync indicator |
| `src/components/mobile/OfflineBadge.tsx` | Content availability badge |
| `src/services/offlineStorageManager.ts` | Storage quota management |

### Files to Modify

| File | Changes |
|------|---------|
| `src/main.tsx` | Expand query persistence config, use native persister |
| `src/hooks/mobile/useBackgroundSync.ts` | Complete `processOperation` implementation |
| `public/sw.js` | Add API response caching |
| `src/App.tsx` | Add OfflineModeBanner and SyncStatusIndicator |
| `src/hooks/useFeedQuery.ts` | Integrate offline actions for likes/saves |
| `src/components/CommunityFeed.tsx` | Add offline indicators |

---

## Technical Considerations

### Storage Limits

| Platform | localStorage | Capacitor Preferences |
|----------|--------------|----------------------|
| Web | ~5-10MB | N/A |
| iOS | ~5MB | ~50MB+ |
| Android | ~10MB | ~50MB+ |

**Strategy**: Use Capacitor Preferences on native for larger storage quota

### Data Freshness

| Data Type | Stale Time | Max Cache Age |
|-----------|------------|---------------|
| Emergency Contacts | 1 hour | Forever |
| Profile | 5 minutes | 24 hours |
| Feed | 30 seconds | 24 hours |
| Conversations | 1 minute | 7 days |
| Notifications | 30 seconds | 7 days |
| Events | 5 minutes | 24 hours |

### Battery Considerations

The existing `useBatteryStatus` hook will be integrated:
- Pause background sync when battery is low and not charging
- Reduce sync frequency on low battery
- Skip prefetching when battery is critical

---

## Migration Path

1. **Phase 1-2** can be implemented immediately with no breaking changes
2. **Phase 3** requires careful testing of the sync queue
3. **Phase 4** is purely additive UI
4. **Phase 5** requires service worker update and cache clearing
5. **Phase 6** is optimization that can be added incrementally

---

## Testing Strategy

1. **Airplane Mode Testing**: Toggle airplane mode during various actions
2. **Kill App While Offline**: Ensure queued actions persist
3. **Slow Connection Simulation**: Test retry logic with network throttling
4. **Storage Quota Testing**: Fill storage and verify graceful degradation
5. **Cross-Platform Verification**: Test on iOS, Android, and web

---

## Success Metrics

- Users can view cached feed content with 0ms network wait
- Queued actions sync within 30 seconds of connectivity restoration
- Emergency contacts are always accessible (even on first app launch after install)
- Storage usage stays under 80% of platform quota
- No data loss when app is killed while offline
