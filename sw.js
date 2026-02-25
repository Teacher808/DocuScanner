const CACHE_NAME = 'docuscan-pro-v2';

// Core assets to cache immediately
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(CORE_ASSETS))
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - Network-first for APIs, Cache-first for assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. DO NOT CACHE database or API requests (Firebase & Google Drive)
    if (url.hostname.includes('firestore.googleapis.com') || 
        url.hostname.includes('identitytoolkit.googleapis.com') ||
        url.hostname.includes('script.google.com') ||
        url.hostname.includes('script.googleusercontent.com')) {
        // Let these go directly to the network
        return; 
    }

    // 2. Cache-First strategy for external libraries (Tailwind, jsPDF, Icons, Firebase SDKs)
    if (url.hostname.includes('cdn.tailwindcss.com') ||
        url.hostname.includes('cdnjs.cloudflare.com') ||
        url.hostname.includes('unpkg.com') ||
        url.hostname.includes('gstatic.com')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }

    // 3. Default Stale-While-Revalidate for everything else (like index.html)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
            }).catch(() => {
                // Ignore network errors on fetch (user might be offline)
            });
            return cachedResponse || fetchPromise;
        })
    );
});
