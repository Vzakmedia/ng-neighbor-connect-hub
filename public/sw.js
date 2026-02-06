// Enhanced Service Worker with caching strategies and offline API support
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const AUDIO_CACHE = `audio-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// Supabase API endpoints that can be cached for offline access (read-only GET requests)
const CACHEABLE_API_ENDPOINTS = [
  '/rest/v1/community_posts',
  '/rest/v1/profiles',
  '/rest/v1/events',
  '/rest/v1/businesses',
  '/rest/v1/marketplace_items',
  '/rest/v1/services',
  '/rest/v1/emergency_contacts',
  '/rest/v1/direct_conversations',
  '/rest/v1/notifications',
];

// Cache TTL for API responses (in milliseconds)
const API_CACHE_TTL = {
  'emergency_contacts': 24 * 60 * 60 * 1000, // 24 hours - critical data
  'profiles': 60 * 60 * 1000, // 1 hour
  'community_posts': 5 * 60 * 1000, // 5 minutes
  'events': 30 * 60 * 1000, // 30 minutes
  'default': 10 * 60 * 1000, // 10 minutes
};

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/neighborlink-logo.png',
  '/notification.mp3',
  '/notification-bell.mp3',
  '/notification-chime.mp3',
  '/notification-ding.mp3'
];

console.log('Service Worker: Starting...');

// Listen for push notifications
self.addEventListener('push', function (event) {
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
self.addEventListener('notificationclick', function (event) {
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
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
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
self.addEventListener('sync', function (event) {
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
self.addEventListener('message', function (event) {
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

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE &&
            cacheName !== DYNAMIC_CACHE &&
            cacheName !== IMAGE_CACHE &&
            cacheName !== AUDIO_CACHE &&
            cacheName !== API_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Check if an API endpoint should be cached
function shouldCacheApiEndpoint(url) {
  return CACHEABLE_API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint));
}

// Get cache TTL for an endpoint
function getApiCacheTTL(pathname) {
  for (const [key, ttl] of Object.entries(API_CACHE_TTL)) {
    if (pathname.includes(key)) return ttl;
  }
  return API_CACHE_TTL.default;
}

// Check if cached response is still valid
function isCacheValid(response, ttl) {
  const cachedTime = response.headers.get('sw-cached-time');
  if (!cachedTime) return false;
  return (Date.now() - parseInt(cachedTime, 10)) < ttl;
}

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle Supabase API caching for specific read-only endpoints
  if (url.hostname.includes('supabase') && shouldCacheApiEndpoint(url)) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const ttl = getApiCacheTTL(url.pathname);

        // Return cached response if valid (stale-while-revalidate)
        if (cachedResponse && isCacheValid(cachedResponse, ttl)) {
          // Revalidate in background
          fetch(request).then(freshResponse => {
            if (freshResponse.ok) {
              const headers = new Headers(freshResponse.headers);
              headers.set('sw-cached-time', Date.now().toString());

              freshResponse.clone().blob().then(body => {
                const cachedWithTime = new Response(body, {
                  status: freshResponse.status,
                  statusText: freshResponse.statusText,
                  headers: headers,
                });
                cache.put(request, cachedWithTime);
              });
            }
          }).catch(() => {
            // Silently fail background revalidation
          });

          console.log('Service Worker: API from cache:', url.pathname);
          return cachedResponse;
        }

        // Fetch fresh data
        try {
          const freshResponse = await fetch(request);

          if (freshResponse.ok) {
            const headers = new Headers(freshResponse.headers);
            headers.set('sw-cached-time', Date.now().toString());

            const body = await freshResponse.clone().blob();
            const cachedWithTime = new Response(body, {
              status: freshResponse.status,
              statusText: freshResponse.statusText,
              headers: headers,
            });
            cache.put(request, cachedWithTime);
          }

          return freshResponse;
        } catch (error) {
          // Return stale cache if available when offline
          if (cachedResponse) {
            console.log('Service Worker: Returning stale API cache (offline):', url.pathname);
            return cachedResponse;
          }
          throw error;
        }
      })
    );
    return;
  }

  // Skip other Supabase API calls (auth, realtime, storage, etc.)
  if (url.hostname.includes('supabase')) return;

  // Audio files - Cache First strategy
  if (request.url.endsWith('.mp3')) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(cache => {
        return cache.match(request).then(response => {
          if (response) {
            console.log('Service Worker: Audio from cache:', request.url);
            return response;
          }
          return fetch(request).then(fetchResponse => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
    return;
  }

  // Images - Cache First with fallback
  if (request.destination === 'image' ||
    request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(cache => {
        return cache.match(request).then(response => {
          if (response) return response;

          return fetch(request).then(fetchResponse => {
            // Only cache successful responses
            if (fetchResponse.ok) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          }).catch(() => {
            // Return fallback for failed image loads
            return new Response('<svg><!-- fallback --></svg>', {
              headers: { 'Content-Type': 'image/svg+xml' }
            });
          });
        });
      })
    );
    return;
  }

  // Static assets - Cache First
  if (STATIC_ASSETS.some(asset => request.url.endsWith(asset))) {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(fetchResponse => {
          return caches.open(STATIC_CACHE).then(cache => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
    return;
  }

  // HTML pages - Network First with cache fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then(response => {
            return response || caches.match('/');
          });
        })
    );
    return;
  }

  // Default - Network First
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

console.log('Service Worker: Loaded successfully');