# Caching Strategy - Sass Store

## ¿Nos conviene implementar cache?

**Respuesta: SÍ, ABSOLUTAMENTE**

El caching es crítico para:

1. **Performance:** Reducir carga en base de datos y APIs
2. **Costs:** Menos queries = menos gastos de infraestructura
3. **UX:** Respuestas más rápidas = mejor experiencia de usuario
4. **Scalability:** Soportar más usuarios concurrentes

## Estrategia de Caching Recomendada

### 1. **Redis Cache (Alta Prioridad)** ⭐⭐⭐⭐⭐

**Uso recomendado:**

- Session storage
- Rate limiting
- API response caching
- Shopping cart data
- Real-time booking availability

**Implementación:**

```typescript
// packages/cache/redis.ts
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

// Cache wrapper con TTL
export async function cacheGet<T>(key: string): Promise<T | null> {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttl: number = 300, // 5 minutes default
): Promise<void> {
  await redis.setex(key, ttl, JSON.stringify(value));
}

export async function cacheInvalidate(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// Tenant-specific cache
export function tenantCacheKey(tenant: string, key: string): string {
  return `tenant:${tenant}:${key}`;
}
```

**Casos de uso específicos:**

```typescript
// Example: Cache product catalog per tenant
export async function getProducts(tenantId: string) {
  const cacheKey = tenantCacheKey(tenantId, "products:all");

  // Try cache first
  const cached = await cacheGet<Product[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from DB
  const products = await db.query.products.findMany({
    where: eq(products.tenantId, tenantId),
  });

  // Cache for 5 minutes
  await cacheSet(cacheKey, products, 300);

  return products;
}

// Example: Cache booking availability
export async function getAvailableSlots(
  tenantId: string,
  serviceId: string,
  date: string,
) {
  const cacheKey = tenantCacheKey(
    tenantId,
    `availability:${serviceId}:${date}`,
  );

  const cached = await cacheGet<TimeSlot[]>(cacheKey);
  if (cached) return cached;

  const slots = await calculateAvailability(serviceId, date);

  // Cache for 1 minute (availability changes frequently)
  await cacheSet(cacheKey, slots, 60);

  return slots;
}
```

**TTL Recommendations:**

| Data Type            | TTL      | Reason               |
| -------------------- | -------- | -------------------- |
| Product catalog      | 5 min    | Changes infrequently |
| Service list         | 10 min   | Rarely changes       |
| Booking availability | 1 min    | Changes frequently   |
| User session         | 24 hours | Long-lived           |
| Cart data            | 1 hour   | User-specific        |
| API responses        | 30 sec   | Real-time feel       |
| Media URLs           | 1 day    | CDN handles this     |

---

### 2. **Next.js Cache (Built-in)** ⭐⭐⭐⭐⭐

**Ya lo tienes, optimízalo:**

```typescript
// app/t/[tenant]/products/page.tsx
export const revalidate = 300; // ISR: revalidate every 5 minutes

export async function generateStaticParams() {
  // Pre-generate common tenants
  return [
    { tenant: 'wondernails' },
    { tenant: 'vigistudio' },
    { tenant: 'centro-tenistico' },
  ];
}

// Fetch with cache
async function getProducts(tenant: string) {
  const res = await fetch(`http://localhost:3001/api/products?tenant=${tenant}`, {
    next: {
      revalidate: 300, // Cache for 5 minutes
      tags: [`products-${tenant}`]
    }
  });

  return res.json();
}

// Invalidate cache on-demand
import { revalidateTag } from 'next/cache';

export async function updateProduct(tenantId: string, productId: string) {
  // Update in DB
  await db.update(products).set({ ... });

  // Invalidate cache
  revalidateTag(`products-${tenantId}`);
}
```

---

### 3. **CDN Caching (Cloudflare)** ⭐⭐⭐⭐

**Para assets estáticos:**

```typescript
// next.config.js
module.exports = {
  images: {
    domains: ["cdn.sassstore.com"],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // 24 hours
  },

  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
    ];
  },
};
```

---

### 4. **Browser Cache (Service Worker)** ⭐⭐⭐

**PWA con offline support:**

```typescript
// public/sw.js
const CACHE_NAME = "sass-store-v1";
const STATIC_ASSETS = ["/", "/manifest.json", "/offline.html"];

// Cache-first strategy for static assets
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("/api/")) {
    // Network-first for API calls
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const cache = caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
  } else {
    // Cache-first for static assets
    event.respondWith(
      caches
        .match(event.request)
        .then((response) => response || fetch(event.request)),
    );
  }
});
```

---

### 5. **React Query / SWR (Client-side)** ⭐⭐⭐⭐

**Para datos dinámicos:**

```typescript
// Using React Query
import { useQuery } from "@tanstack/react-query";

export function useProducts(tenantId: string) {
  return useQuery({
    queryKey: ["products", tenantId],
    queryFn: () => fetchProducts(tenantId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// Using SWR
import useSWR from "swr";

export function useProducts(tenantId: string) {
  const { data, error } = useSWR(`/api/products?tenant=${tenantId}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1 minute
  });

  return { products: data, isLoading: !error && !data, error };
}
```

---

## Invalidación de Cache (Cache Invalidation)

**Estrategia por tipo de dato:**

### 1. Time-based (TTL)

```typescript
// Para datos que cambian predeciblemente
await cacheSet("products:featured", products, 3600); // 1 hour
```

### 2. Event-based

```typescript
// Cuando se actualiza un producto
export async function updateProduct(
  tenantId: string,
  productId: string,
  data: any,
) {
  await db.update(products).set(data);

  // Invalidate related caches
  await cacheInvalidate(`tenant:${tenantId}:products:*`);
  await revalidateTag(`products-${tenantId}`);
}
```

### 3. Manual

```typescript
// Admin dashboard action
export async function clearCache(tenantId: string) {
  await cacheInvalidate(`tenant:${tenantId}:*`);
}
```

---

## Monitoreo de Cache

```typescript
// Cache hit rate monitoring
export async function getCacheStats(tenantId: string) {
  const stats = await redis.info("stats");

  return {
    hits: parseInt(stats.match(/keyspace_hits:(\d+)/)?.[1] || "0"),
    misses: parseInt(stats.match(/keyspace_misses:(\d+)/)?.[1] || "0"),
    hitRate: hits / (hits + misses),
  };
}

// Log cache performance
export async function logCacheMetrics(key: string, hit: boolean) {
  await redis.hincrby("cache:metrics", hit ? "hits" : "misses", 1);
  await redis.hincrby("cache:metrics:keys", key, 1);
}
```

---

## Implementación por Prioridad

### Fase 1: Inmediato (Esta Semana)

1. ✅ Next.js built-in caching (ya está)
2. 🔴 Redis para sessions y rate limiting
3. 🔴 CDN headers para static assets

### Fase 2: Corto Plazo (2 Semanas)

4. 🟡 Redis para API responses
5. 🟡 React Query para client-side
6. 🟡 Cache invalidation strategy

### Fase 3: Mediano Plazo (1 Mes)

7. 🟢 Service Worker para PWA
8. 🟢 Cache monitoring dashboard
9. 🟢 Automated cache warming

---

## Configuración Recomendada

```env
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# Cache TTLs (seconds)
CACHE_TTL_PRODUCTS=300
CACHE_TTL_SERVICES=600
CACHE_TTL_AVAILABILITY=60
CACHE_TTL_SESSION=86400
```

```typescript
// config/cache.ts
export const CACHE_CONFIG = {
  products: { ttl: 300, enabled: true },
  services: { ttl: 600, enabled: true },
  availability: { ttl: 60, enabled: true },
  session: { ttl: 86400, enabled: true },
  cart: { ttl: 3600, enabled: true },
} as const;
```

---

## Beneficios Esperados

| Métrica           | Sin Cache | Con Cache | Mejora     |
| ----------------- | --------- | --------- | ---------- |
| Avg Response Time | 500ms     | 50ms      | **90% ⬇️** |
| DB Queries/min    | 10,000    | 1,000     | **90% ⬇️** |
| Server Cost       | $500/mo   | $150/mo   | **70% ⬇️** |
| P95 Latency       | 2s        | 200ms     | **90% ⬇️** |
| Concurrent Users  | 100       | 1,000     | **10x ⬆️** |

---

## Conclusión

**¿Implementar cache? SÍ, definitivamente.**

**Prioridad:**

1. 🔴 **Redis** - Crítico para performance
2. 🔴 **CDN** - Crítico para static assets
3. 🟡 **React Query** - Importante para UX
4. 🟢 **Service Worker** - Nice to have

**Inversión:** ~2-3 días de desarrollo
**ROI:** 90% reducción en latencia, 70% reducción en costos
