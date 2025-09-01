// public/sw.js
// PWA caching with network-first for HTML to avoid stale UI
const CACHE_VERSION = 'v3';                       // ↑ ganti versi saat rilis baru
const CACHE_STATIC = `fabaro-static-${CACHE_VERSION}`;

// Jangan cache '/' supaya HTML selalu fresh
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

  // 🔹 Network-first untuk navigasi HTML (hindari layout lama)
  const accept = req.headers.get('accept') || '';
  if (req.mode === 'navigate' || accept.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((resp) => resp)
        .catch(() => caches.match(req)) // fallback ke cache jika offline
    );
    return;
  }

  // 🔹 Static & API GET: cache-first, lalu isi/memperbarui cache
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
