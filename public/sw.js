const CACHE_NAME = 'mergulho-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/idvmergulho/logo.png',
  '/idvmergulho/logo-white.png',
  '/idvmergulho/logo-horizontal.png',
  '/idvmergulho/logo-horizontal-azul.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first for API/Supabase calls
  if (event.request.url.includes('supabase.co')) {
    return;
  }
  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => caches.match('/index.html'));
    })
  );
});
