// Simple Service Worker to enable PWA Installation
const CACHE_NAME = 'acv-map-v1';
const ASSETS = [
    './',
    './index.html',
    './ACV-logo.png'
];

// Install Event
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    self.skipWaiting(); // Kích hoạt ngay lập tức bản mới
});

// Activate Event
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activated');
    // Xóa toàn bộ cache cũ để nạp URL mới chuẩn xác
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing Old Cache...', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
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
