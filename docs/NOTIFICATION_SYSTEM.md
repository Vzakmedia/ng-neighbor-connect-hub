# Notification System Architecture

## Overview
The notification system has been migrated to a centralized Zustand-based architecture for better performance, persistence, and real-time capabilities.

## Key Components

### 1. Notification Store (`src/store/notificationStore.ts`)
- **Purpose**: Single source of truth for all notifications
- **Features**:
  - Zustand state management
  - LocalStorage persistence
  - Cross-tab synchronization
  - Server synchronization with Supabase
  - Automatic deduplication
  - Auto-cleanup of old notifications (30 days)

### 2. Realtime Hook (`src/hooks/useRealtimeNotifications.ts`)
- **Purpose**: Centralized real-time subscriptions
- **Subscriptions**:
  - `alert_notifications` - Server-generated notifications
  - `direct_messages` - New message notifications
  - `community_posts` - Community activity
  - `safety_alerts` - Safety and emergency alerts
  - `panic_alerts` - Urgent emergency notifications

### 3. UI Components
- **NotificationBell** (`src/components/notifications/NotificationBell.tsx`)
  - Bell icon with unread count badge
  - Click to toggle notification panel
  
- **NotificationPanel** (`src/components/notifications/NotificationPanel.tsx`)
  - Scrollable notification list
  - Filter by type (all, messages, alerts)
  - Mark as read/unread
  - Delete notifications
  - Action buttons (accept request, call, etc.)

## Usage

### Basic Setup (Already Configured)
```typescript
// In PlatformRoot.tsx (already done)
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useNotificationStore } from '@/store/notificationStore';

function App() {
  // Initialize real-time subscriptions
  useRealtimeNotifications();
  
  // Sync with server on login
  const syncWithServer = useNotificationStore(state => state.syncWithServer);
  useEffect(() => {
    if (user?.id) {
      syncWithServer(user.id);
    }
  }, [user?.id]);
}
```

### Using in Components
```typescript
// Access notification state
import { useNotificationStore } from '@/store/notificationStore';

function MyComponent() {
  const notifications = useNotificationStore(state => state.notifications);
  const unreadCount = useNotificationStore(state => state.unreadCount);
  const markAsRead = useNotificationStore(state => state.markAsRead);
  
  return (
    <div>
      Unread: {unreadCount}
      <button onClick={() => markAsRead(notificationId)}>
        Mark as Read
      </button>
    </div>
  );
}
```

### UI Components
```typescript
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';

function Header() {
  const [showPanel, setShowPanel] = useState(false);
  
  return (
    <>
      <NotificationBell onClick={() => setShowPanel(!showPanel)} />
      {showPanel && (
        <NotificationPanel 
          onClose={() => setShowPanel(false)}
          position="top-right"
        />
      )}
    </>
  );
}
```

## Database Schema

### alert_notifications Table
```sql
- id: uuid (primary key)
- recipient_id: uuid (references user)
- notification_type: text (message, emergency, alert, etc.)
- content: text
- sender_name: text
- sender_phone: text
- is_read: boolean
- read_at: timestamp
- sent_at: timestamp
- alert_id: uuid (optional)
- panic_alert_id: uuid (optional)
- request_id: uuid (optional)
- notification_metadata: jsonb (flexible data storage)
- notification_category: text (for filtering)
```

### Indexes (for performance)
- `idx_alert_notifications_recipient_unread` - Fast unread queries
- `idx_alert_notifications_recipient_sent` - Fast sorting by date
- `idx_alert_notifications_type` - Fast filtering by type

## Features

### ✅ Persistence
- Notifications persist across page refreshes (LocalStorage)
- Synced with Supabase database
- Cross-tab synchronization

### ✅ Real-time Updates
- Instant notifications from all subscribed tables
- Automatic sound and push notifications
- Priority-based alerts (normal, high, urgent)

### ✅ Deduplication
- Prevents duplicate notifications by ID
- Smart merging of server and local state

### ✅ Performance
- Optimized Zustand selectors prevent unnecessary re-renders
- Database indexes for fast queries
- Limited to 100 most recent notifications

### ✅ User Actions
- Mark as read/unread
- Delete notifications
- Accept contact requests
- Make phone calls
- Navigate to related content

## Migration from Old System

### Deprecated Hooks
- ❌ `useSimpleNotifications.tsx` - Use `useNotificationStore` instead
- ❌ `usePushNotifications.tsx` - Use `useRealtimeNotifications` instead

### Migration Steps
1. Remove imports of deprecated hooks
2. Import `useNotificationStore` for state access
3. Import `useRealtimeNotifications` in root component (already done)
4. Use `NotificationBell` and `NotificationPanel` components for UI

## Best Practices

1. **Subscribe Once**: Call `useRealtimeNotifications()` only in root component
2. **Selective Access**: Use Zustand selectors to access only needed state
3. **Server Sync**: Always sync on login with `syncWithServer(userId)`
4. **Type Safety**: Use `NotificationData` interface for type checking
5. **Cleanup**: Automatic cleanup removes notifications older than 30 days

## Troubleshooting

### Notifications not appearing?
- Check browser console for subscription errors
- Verify RLS policies allow user access to `alert_notifications`
- Ensure `useRealtimeNotifications()` is called in root component

### Duplicate notifications?
- Deduplication is automatic by notification ID
- Check that notification IDs are unique

### Performance issues?
- Zustand store limits to 100 notifications
- Old notifications auto-cleanup after 30 days
- Use selective subscriptions if needed

## Future Enhancements
- [ ] Push notification registration for mobile
- [ ] Notification preferences (mute/unmute types)
- [ ] Batch operations (delete all, mark all read)
- [ ] Rich notification templates
- [ ] Notification scheduling
