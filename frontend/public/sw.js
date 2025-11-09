/**
 * Service Worker for PWA Notifications
 * Handles background notifications when app is closed
 */

const CACHE_NAME = 'cursormobile-v1';
const urlsToCache = [
  '/',
  '/chat',
  '/icon-192.png',
  '/icon-512.png',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .catch((error) => {
        console.error('Service worker install error:', error);
      })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  return self.clients.claim(); // Take control of all pages
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both fail, return offline page if available
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Push event - handle push notifications (for future use)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'New Message';
  const options = {
    body: data.body || 'You have a new message',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag,
    data: data.data,
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event - handle when user clicks notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const urlToOpen = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Track notified message IDs in service worker to prevent duplicates
// This is a simple in-memory cache (will reset on service worker restart, but that's okay)
const notifiedMessageIds = new Set();

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
  
  // Handle task complete notifications
  if (event.data && event.data.type === 'TASK_COMPLETE') {
    const messageId = event.data.messageId;
    
    // Double-check: don't notify if we've already notified for this message ID
    // (Main thread should have checked, but this prevents service worker duplicates)
    if (messageId && notifiedMessageIds.has(messageId)) {
      console.log('🔔 Service Worker: Skipping duplicate notification for message', messageId);
      return;
    }
    
    // Mark as notified
    if (messageId) {
      notifiedMessageIds.add(messageId);
      // Limit cache size to prevent memory issues (keep last 100)
      if (notifiedMessageIds.size > 100) {
        const firstId = notifiedMessageIds.values().next().value;
        notifiedMessageIds.delete(firstId);
      }
    }
    
    console.log('🔔 Service Worker: Task complete notification', messageId ? `for message ${messageId}` : '');
    
    event.waitUntil(
      self.registration.showNotification('Task Complete! 🎉', {
        body: 'Your Cursor task has been completed!',
        tag: messageId ? `task-complete-${messageId}` : 'task-complete', // Use message ID in tag for browser-level deduplication
        data: {
          url: '/chat',
          timestamp: event.data.timestamp || Date.now(),
          messageId: messageId,
        },
        requireInteraction: false,
        vibrate: [200, 100, 200],
        badge: '/icon-192.png',
      })
    );
  }
});

