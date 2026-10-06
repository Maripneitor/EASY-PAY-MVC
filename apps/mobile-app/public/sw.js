const CACHE_NAME = 'easy-pay-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/assets/images/logo-ep.png',
  '/assets/images/icon.png'
];

// Instala el Service Worker y cachea los assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('PWA: Archivos cacheados exitosamente');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activa el Service Worker y limpia caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('PWA: Limpiando cache antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia Stale-While-Revalidate para mayor fluidez
self.addEventListener('fetch', (event) => {
  // Solo manejar peticiones GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchedResponse = fetch(event.request).then((networkResponse) => {
        // Actualiza la cache con la nueva respuesta si es válida
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback si no hay red ni cache (ej: offline y no cacheado)
        return null;
      });

      return cachedResponse || fetchedResponse;
    })
  );
});
