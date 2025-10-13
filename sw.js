// sw.js
const CACHE_NAME = '12th-mcq-cache-v1'; // सुनिश्चित करें कि यह नाम यूनिक है

// ✅ सही URLs बिना शुरू वाले स्लैश के
const urlsToCache = [
  './', // यह index.html को दर्शाता है
  './index.html',
  './analytics.html',
  './style.css',
  './script.js',
  './manifest.json',
  './subjects.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache and caching assets');
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.error('Failed to cache files during install:', err);
            })
    );
});
// Fetch: Serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return response from cache or fetch from network
                return response || fetch(event.request);
            })
    );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

});

