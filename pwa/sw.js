const CACHE_NAME = 'pwa-v12';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/cofibrain-sml.png',
    '/words_english.csv',
    '/words_math.csv',
    '/words_ml.csv',
    '/words_cs.csv',
    '/words_eng.csv',
    '/words_cuda.csv'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            clients.claim(),
            caches.keys().then(cacheNames =>
                Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
                    })
                )
            )
        ])
    );
});