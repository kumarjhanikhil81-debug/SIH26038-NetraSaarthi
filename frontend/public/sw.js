/**
 * NetraSaarthi PWA Service Worker
 * Implements App Shell caching for offline-first rural healthcare deployment.
 */

const CACHE_NAME = 'netrasaarthi-shell-v1';

const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/favicon.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg',
];

// Install: pre-cache static application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: serve cached shell, bypass for backend APIs
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Bypass backend API and static upload routes (handled by app offline queue)
  if (
    url.port === '8000' ||
    url.pathname.startsWith('/screenings') ||
    url.pathname.startsWith('/patients') ||
    url.pathname.startsWith('/doctors') ||
    url.pathname.startsWith('/health') ||
    url.pathname.startsWith('/static/uploads')
  ) {
    return;
  }

  // 2. Navigation fallback for Single-Page Application (SPA) routes
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 3. Stale-while-revalidate for static frontend assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
