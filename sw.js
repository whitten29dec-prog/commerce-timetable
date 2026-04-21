// Commerce Timetable PWA Service Worker
// Version 4.0 - Offline Support

const CACHE_NAME = 'commerce-timetable-v4';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install - cache all assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('Caching app assets');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      // Return cached version if available
      if (response) {
        return response;
      }
      // Otherwise fetch from network
      return fetch(event.request).then(function(networkResponse) {
        // Cache new responses (except JSZip CDN - always fetch fresh)
        if (event.request.url.includes('cdnjs.cloudflare.com')) {
          return networkResponse;
        }
        return caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(function() {
        // If both cache and network fail, return offline page
        return caches.match('./index.html');
      });
    })
  );
});
