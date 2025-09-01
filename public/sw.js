// Simple cache-first service worker
const CACHE_NAME = 'fabaro-always-v1';
const PRECACHE = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null)))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(()=>{});
        return resp;
      }).catch(() => cached);
    })
  );
});
