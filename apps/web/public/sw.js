// Service Worker básico para cache offline (sin costo adicional)
const CACHE_NAME = 'sass-store-v1';
const STATIC_CACHE = 'sass-store-static-v1';
const API_CACHE = 'sass-store-api-v1';

// Recursos estáticos críticos para cache
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  // Agregar más recursos estáticos según sea necesario
];

// Cache first strategy para recursos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Network first strategy para APIs (siempre intentar red primero)
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache API responses (productos, tenants) por 2 minutos
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then(cache => {
        return fetch(request).then(response => {
          // Cache successful responses
          if (response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => {
          // Fallback to cache if network fails
          return cache.match(request);
        });
      })
    );
  }
  // Cache static assets
  else if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
  }
});

// Limpiar caches antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Limpiar cache API cada 5 minutos para evitar datos obsoletos
setInterval(() => {
  caches.open(API_CACHE).then(cache => {
    cache.keys().then(requests => {
      requests.forEach(request => {
        const url = new URL(request.url);
        if (url.pathname.startsWith('/api/')) {
          // Verificar si el cache tiene más de 2 minutos
          cache.match(request).then(response => {
            if (response) {
              const cachedTime = response.headers.get('sw-cache-time');
              if (cachedTime && (Date.now() - parseInt(cachedTime)) > 120000) {
                cache.delete(request);
              }
            }
          });
        }
      });
    });
  });
}, 300000); // 5 minutos