// Simple Service Worker to enable PWA Installation
const CACHE_NAME = 'acv-map-v1';
const ASSETS = [
    './',
    './index.html',
    './ACV-logo.png'
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Service Worker: Caching essential assets');
            return cache.addAll(ASSETS);
        })
    );
});

// Activate Event
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activated');
});

// Fetch Event (Required for PWA)
self.addEventListener('fetch', (event) => {
    // Simple pass-through fetch logic
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
