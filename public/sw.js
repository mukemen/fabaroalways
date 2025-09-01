// public/sw.js
// PWA caching — network-first untuk HTML supaya UI tidak nyangkut versi lama
const CACHE_VERSION = 'v6';                 // ⬅️ ganti angka/label tiap rilis
const CACHE_STATIC  = `fabaro-static-${CACHE_VERSION}`;

// Tidak mem-precache '/' supaya HTML selalu fresh
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_STATIC ? caches.delete(k) : undefined)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // 🔹 Network-first untuk navigasi/HTML agar selalu ambil layout terbaru
  const accept = req.headers.get('accept') || '';
  if (req.mode === 'navigate' || accept.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((resp) => resp)
        .catch(() => caches.match(req)) // fallback offline
    );
    return;
  }

  // 🔹 Static & asset lain: cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_STATIC).then((cache) => cache.put(req, copy)).catch(() => {});
        return resp;
      }).catch(() => cached);
    })
  );
});
