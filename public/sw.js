const CACHE_NAME = 'mergulho-cache-v1';

// Only cache logo images, not the app shell
const STATIC_ASSETS = [
  '/idvmergulho/logo.png',
  '/idvmergulho/logo-white.png',
  '/idvmergulho/logo-horizontal.png',
  '/idvmergulho/logo-horizontal-azul.png',
];

self.addEventListener('install', (event) => {
  // Skip waiting so the new SW activates immediately
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Only cache static images, NOT the app shell
      return Promise.allSettled(
        STATIC_ASSETS.map(url => cache.add(url).catch(() => {}))
      );
    })
  );
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
  const url = new URL(event.request.url);

  // ALWAYS use network for: navigation, Supabase, auth, API calls
  if (
    event.request.mode === 'navigate' ||
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('/auth/') ||
    url.pathname.includes('/rest/') ||
    url.pathname.includes('/realtime/')
  ) {
    // Network only - do not intercept
    return;
  }

  // For static image assets: cache first, then network
  if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          return response;
        });
      })
    );
    return;
  }

  // Everything else: network only
});
