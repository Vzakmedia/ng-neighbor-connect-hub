# Community Feed Performance Guide

## Overview
The community feed is built with React Query for optimal performance, caching, and user experience. This guide explains the architecture and optimizations.

---

## Key Features

### 1. **Infinite Scroll**
- Automatically loads next page at 80% scroll
- Smooth transitions with skeleton loaders
- No pagination delays

### 2. **Smart Caching**
- **30-second stale time**: Instant back-navigation
- **10-minute cache lifetime**: Reduces API calls
- **24-hour persistence**: Offline viewing of previously loaded posts
- **Cross-tab synchronization**: Cache shared across browser tabs

### 3. **Optimistic Updates**
Actions feel instant with optimistic UI updates:
- ✅ **Like/Unlike**: Updates immediately, rolls back on error
- 💾 **Save/Unsave**: Instant feedback
- 📝 **Create Post**: Post appears at top with "Publishing..." badge

### 4. **Real-Time Updates**
- Twitter-style "New posts available" banner
- Supabase real-time subscriptions for live data
- Smooth refresh without losing scroll position

### 5. **Pull-to-Refresh (Mobile)**
- Native pull-to-refresh gesture
- Works seamlessly in Capacitor WebView
- Disabled on desktop to prevent conflicts

---

## Architecture

### Query Key Structure
```typescript
['feed', { 
  userId: string,
  locationScope: 'neighborhood' | 'city' | 'state' | 'all',
  tags: string[],
  sortBy: 'recent' | 'popular',
  searchQuery: string 
}]
```

### Data Flow
```
User Action
  ↓
React Query (Cache Check)
  ↓
Supabase RPC (`get_feed`)
  ↓
Client-side Filters (tags, search, date)
  ↓
Sorted & Paginated Results
  ↓
LocalStorage Persistence
```

---

## Performance Optimizations

### 1. **Image Lazy Loading**
All images use `loading="lazy"` attribute for progressive loading.

### 2. **Skeleton Loaders**
- Show during initial load
- Animate smoothly with fade-in
- Better UX than spinners

### 3. **Staggered Animations**
Posts animate in with a 50ms delay between each for polish.

### 4. **Prefetching**
Next page is prefetched when user reaches 80% scroll (can be enabled via `useFeedPrefetch` hook).

### 5. **Memoization**
- `useMemo` for filtered/sorted events
- `useMemo` for available tags extraction
- `useMemo` for active filter count

---

## Cache Management

### Automatic Invalidation
Cache invalidates on:
- ✅ New post created (real-time)
- ✅ Post liked/saved
- ✅ Post deleted
- ✅ User pulls to refresh

### Manual Invalidation
```typescript
queryClient.invalidateQueries({ queryKey: ['feed'] });
```

### Cache Persistence
Feed data persists to `localStorage` with:
- Max age: 24 hours
- Only `feed` queries persisted
- Automatic cleanup of expired data

---

## Optimistic Update Flow

### Like Example
```typescript
1. User clicks like button
2. UI updates immediately (like count +1, button state changes)
3. API request sent to Supabase
4. On success: Cache updated
5. On error: Rollback to previous state + show error toast
```

### Create Post Example
```typescript
1. User submits post
2. Temporary post added to top of feed (marked as optimistic)
3. API request sent to Supabase
4. On success: Replace temp post with real post from server
5. On error: Remove temp post + show error toast
```

---

## Real-Time Integration

### Supabase Channels
- **community_posts_changes**: Listens for INSERT/UPDATE/DELETE
- **post_likes_changes**: Updates like counts in real-time
- **post_comments_changes**: Updates comment counts

### New Posts Banner
```typescript
useNewPostsStore()  // Zustand store for banner state
  ↓
Supabase INSERT event
  ↓
setHasNewPosts(true)
  ↓
Banner appears with animation
  ↓
User clicks → invalidate queries → smooth refresh
```

---

## Mobile Optimizations

### Pull-to-Refresh
Only enabled on mobile devices (detected via `useIsMobile` hook):
```typescript
if (isMobile) {
  return (
    <PullToRefresh onRefresh={handlePullRefresh}>
      {feedContent}
    </PullToRefresh>
  );
}
```

### Responsive Padding
- Desktop: `px-4`
- Mobile: `px-2` (more screen space)

### Touch Gestures
- Swipe-friendly cards
- Large tap targets (44x44px minimum)

---

## Performance Metrics

### Target Metrics
- **Time to First Post**: < 500ms (from cache)
- **Initial Load**: < 2s (fresh fetch)
- **Scroll to Next Page**: < 300ms
- **Optimistic Update**: Instant (<16ms)
- **Real-time Update Latency**: < 1s

### Monitoring
Use React Query DevTools in development:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<ReactQueryDevtools initialIsOpen={false} />
```

---

## Best Practices

### ✅ DO
- Use optimistic updates for user actions
- Invalidate queries on mutations
- Persist critical data to localStorage
- Show loading skeletons instead of spinners
- Use `staleTime` to reduce refetches

### ❌ DON'T
- Fetch same data multiple times
- Block UI while loading
- Forget error handling
- Clear cache unnecessarily
- Ignore real-time updates

---

## Debugging

### Check Cache State
```typescript
const queryClient = useQueryClient();
const cacheData = queryClient.getQueryData(['feed', filters]);
console.log('Current cache:', cacheData);
```

### Force Refetch
```typescript
queryClient.invalidateQueries({ queryKey: ['feed'] });
// or
refetch();
```

### Clear All Cache
```typescript
queryClient.clear();
```

---

## Future Enhancements

### Potential Optimizations
1. **Virtualization**: Use `@tanstack/react-virtual` for 100+ posts
2. **Service Worker**: Cache API responses offline
3. **WebSockets**: Replace polling with persistent connections
4. **Image CDN**: Optimize images with Cloudinary/imgix
5. **Code Splitting**: Lazy load heavy components

---

## Troubleshooting

### Issue: Stale Data
**Solution**: Reduce `staleTime` or invalidate queries more frequently

### Issue: Slow Initial Load
**Solution**: Enable SSR/SSG or increase cache persistence

### Issue: High Memory Usage
**Solution**: Reduce `gcTime` or implement virtualization

### Issue: Network Errors
**Solution**: Already handled with retry logic (1 retry) and error toasts

---

## Related Files
- `src/hooks/useFeedQuery.ts` - Main feed hook
- `src/components/CommunityFeed.tsx` - Feed container
- `src/components/CommunityFeedContent.tsx` - Feed renderer
- `src/components/NewPostsBanner.tsx` - Real-time banner
- `src/hooks/useCommunitySubscriptions.tsx` - Real-time subscriptions
- `src/main.tsx` - Query client configuration
