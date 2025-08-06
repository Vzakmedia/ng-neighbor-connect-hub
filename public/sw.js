// Service Worker for background notifications
console.log('Service Worker: Starting...');

// Listen for push notifications
self.addEventListener('push', function(event) {
  console.log('Service Worker: Push event received');
  
  if (event.data) {
    const data = event.data.json();
    console.log('Service Worker: Push data:', data);
    
    const options = {
      body: data.body || 'New notification',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      data: data,
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/favicon.ico'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      requireInteraction: data.type === 'emergency',
      silent: false,
      tag: data.tag || 'default'
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'NeighborConnect', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  const notificationData = event.notification.data;
  let urlToOpen = '/dashboard';

  // Route based on notification type
  if (notificationData && notificationData.type) {
    switch (notificationData.type) {
      case 'direct_message':
        urlToOpen = `/messages`;
        break;
      case 'community_post':
        urlToOpen = `/community`;
        break;
      case 'emergency_alert':
      case 'panic_alert':
        urlToOpen = `/safety`;
        break;
      default:
        urlToOpen = '/dashboard';
    }
  }

  if (event.action === 'view') {
    // Open the app to specific URL
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    console.log('Service Worker: Notification dismissed');
  } else {
    // Default action - open the app to specific URL
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url.includes(urlToOpen.split('?')[0]) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no existing window/tab, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Handle background sync
self.addEventListener('sync', function(event) {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'background-notifications') {
    event.waitUntil(
      checkForNotifications()
    );
  }
});

// Function to check for notifications in background
async function checkForNotifications() {
  try {
    console.log('Service Worker: Checking for notifications...');
    // This would typically make an API call to check for new notifications
    // For now, we'll just log that the check happened
  } catch (error) {
    console.error('Service Worker: Error checking notifications:', error);
  }
}

// Handle message events from the main thread
self.addEventListener('message', function(event) {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, type, tag } = event.data;
    
    const options = {
      body: body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: type === 'emergency' ? [200, 100, 200, 100, 200] : [200, 100, 200],
      requireInteraction: type === 'emergency',
      silent: false,
      tag: tag || 'notification',
      data: event.data
    };

    self.registration.showNotification(title, options);
  }
});

console.log('Service Worker: Loaded successfully');