// Names of the caches used in this version of the service worker.
const CACHE_NAME = 'offline-cache-v1';

// List of URLs to cache during the install event.
// We will cache all static assets dynamically during fetch, so this can be empty or contain essential files.
const PRECACHE_URLS = [
  '/',
  '/index.html',
];

// Install event - cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!currentCaches.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - respond with cached resources or fetch from network and cache dynamically
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return caches.open(CACHE_NAME).then(cache => {
        return fetch(event.request).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response to cache it
          const responseToCache = response.clone();
          cache.put(event.request, responseToCache);

          return response;
        });
      });
    }).catch(() => {
      // Optionally, fallback to offline page or image if fetch fails
      // return caches.match('/offline.html');
    })
  );
});
