// Service Worker para SASS Store - Secure Configuration
// SEC-011: API responses are NEVER cached to prevent sensitive data exposure
// Version: 2.0.0 - Security Hardened

const CACHE_VERSION = 'sass-store-v2-secure';
const STATIC_CACHE = 'sass-store-static-v2';

// Recursos estáticos seguros para cache offline
// Solo assets públicos, sin datos sensibles
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  // Agregar más recursos estáticos públicos según sea necesario
];

// Patrones de URL que NUNCA deben cachearse (security-critical)
const NEVER_CACHE_PATTERNS = [
  /^\/api\//,                    // Todas las APIs (auth, users, tenants, etc.)
  /\/auth\//,                    // Cualquier ruta de autenticación
  /\/_next\/data\//,             // Next.js data endpoints
  /\/__nextjs_original-stack-frame/, // Next.js internals
];

// Instalación - solo cachea recursos estáticos públicos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets only');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación - limpia caches antiguos incluyendo el inseguro API_CACHE
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Eliminar todos los caches excepto el estático actual
          if (cacheName !== STATIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activated - API caching DISABLED for security');
      return self.clients.claim();
    })
  );
});

// Fetch handler - Network only para APIs, Cache first para estáticos
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // SECURITY: Verificar si la URL coincide con patrones prohibidos
  const shouldNeverCache = NEVER_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));

  if (shouldNeverCache) {
    // NUNCA cachear APIs - siempre ir a red
    // Esto previene exposición de datos sensibles en cache
    event.respondWith(
      fetch(request)
        .then(response => {
          // Log para auditoría (solo en desarrollo)
          if (url.hostname === 'localhost') {
            console.log('[SW] API request (not cached):', url.pathname);
          }
          return response;
        })
        .catch(error => {
          console.error('[SW] Network error for API:', url.pathname);
          // Retornar error de red, NO usar cache
          return new Response(JSON.stringify({ 
            error: 'Network error',
            message: 'Unable to connect to server'
          }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Para recursos estáticos públicos: Cache first, luego network
  if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) {
          // Retornar cache, actualizar en background
          fetch(request).then(response => {
            if (response.status === 200) {
              caches.open(STATIC_CACHE).then(cache => {
                cache.put(request, response);
              });
            }
          }).catch(() => {
            // Ignorar errores de red en background update
          });
          return cachedResponse;
        }

        // No hay cache, ir a red y cachear
        return fetch(request).then(response => {
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
    return;
  }

  // Para todo lo demás: Network only (no cachear por defecto)
  // Esto es más seguro que cachear agresivamente
  event.respondWith(
    fetch(request).catch(() => {
      // Solo para navegación, intentar servir index desde cache
      if (request.mode === 'navigate') {
        return caches.match('/');
      }
      return new Response('Not available', { status: 503 });
    })
  );
});

// Mensaje de estado para debugging
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SW_STATUS') {
    event.ports[0].postMessage({
      version: CACHE_VERSION,
      apiCaching: 'DISABLED',
      staticCaching: 'ENABLED',
      securityLevel: 'HARDENED'
    });
  }
});
