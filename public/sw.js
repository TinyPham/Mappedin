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
    // Chỉ xử lý các yêu cầu GET
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .catch(async () => {
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) return cachedResponse;

                // Nếu là lỗi CORS hoặc mạng, và không có trong cache, 
                // trả về một Response lỗi hợp lệ thay vì undefined để tránh crash SW
                return new Response('Network error occurred', {
                    status: 408,
                    statusText: 'Network Error'
                });
            })
    );
});
