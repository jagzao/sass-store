# Redis Optimization with Upstash

## Estrategia de Cache Dinámico para Multi-Tenant SaaS

Esta guía define qué cachear en Redis (Upstash) y qué dejar en CDN/ISR.

---

## Principio Fundamental

**Redis solo para datos dinámicos "calientes" con TTL corto**

- ✅ Disponibilidad de slots (cambios frecuentes)
- ✅ Carrito de compras (sesión temporal)
- ✅ Rate limiting (anti-crawler, protección DDoS)
- ❌ **NO** catálogos de productos/servicios (usar ISR + CDN)

---

## 1. Setup y Claves

### Configuración Base

```typescript
// lib/redis.ts
import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

// Helper para generar claves consistentes
export const keys = {
  availability: (tenant: string, serviceId: string) =>
    `av:${tenant}:${serviceId}`,

  cart: (tenant: string, sessionId: string) =>
    `cart:${tenant}:${sessionId}`,

  rateLimit: (tenant: string, ip: string) =>
    `rl:${tenant}:${ip}`,

  session: (tenant: string, sessionId: string) =>
    `session:${tenant}:${sessionId}`,
};
```

---

## 2. Disponibilidad / Slots (TTL Corto: 60-120s)

### Para Wondernails y Vigi Studios - Booking System

```typescript
// lib/availability.ts
import { redis, keys } from "./redis";

export async function getAvailability(
  tenant: string,
  serviceId: string,
  date: string
) {
  const key = `${keys.availability(tenant, serviceId)}:${date}`;

  // Intentar obtener del cache
  const cached = await redis.get(key);
  if (cached) {
    console.log(`[Redis HIT] ${key}`);
    return cached as TimeSlot[];
  }

  // Cache MISS - calcular desde DB
  console.log(`[Redis MISS] ${key}`);
  const slots = await calculateSlotsFromDB(tenant, serviceId, date);

  // Cachear por 60 segundos (alta rotación)
  await redis.set(key, slots, { ex: 60 });

  return slots;
}

// Invalidar cuando se crea una reserva
export async function invalidateAvailability(
  tenant: string,
  serviceId: string,
  date: string
) {
  const key = `${keys.availability(tenant, serviceId)}:${date}`;
  await redis.del(key);
  console.log(`[Redis INVALIDATE] ${key}`);
}

interface TimeSlot {
  time: string;
  available: boolean;
  staffId?: string;
}

async function calculateSlotsFromDB(
  tenant: string,
  serviceId: string,
  date: string
): Promise<TimeSlot[]> {
  // Lógica de negocio: obtener slots disponibles desde DB
  // Considerar: horario del negocio, reservas existentes, duración del servicio
  return []; // Implementar según lógica de negocio
}
```

### Uso en Página de Booking

```typescript
// app/t/[tenant]/services/[serviceId]/booking/page.tsx
import { getAvailability } from "@/lib/availability";

export default async function BookingPage({
  params,
  searchParams
}: {
  params: { tenant: string; serviceId: string };
  searchParams: { date?: string };
}) {
  const date = searchParams.date || new Date().toISOString().split('T')[0];
  const slots = await getAvailability(params.tenant, params.serviceId, date);

  return (
    <div>
      <h1>Reservar Servicio</h1>
      <TimeSlotPicker slots={slots} />
    </div>
  );
}
```

---

## 3. Carrito (TTL: 2 horas)

### Session-Based Cart con Redis

```typescript
// lib/cart.ts
import { redis, keys } from "./redis";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'product' | 'service';
}

export async function getCart(
  sessionId: string,
  tenant: string
): Promise<CartItem[]> {
  const key = keys.cart(tenant, sessionId);
  const cart = await redis.get(key);
  return (cart as CartItem[]) || [];
}

export async function setCart(
  sessionId: string,
  tenant: string,
  cart: CartItem[]
): Promise<void> {
  const key = keys.cart(tenant, sessionId);
  // TTL 2 horas - auto-expire
  await redis.set(key, cart, { ex: 7200 });
}

export async function addToCart(
  sessionId: string,
  tenant: string,
  item: CartItem
): Promise<CartItem[]> {
  const cart = await getCart(sessionId, tenant);

  const existingIndex = cart.findIndex(i => i.id === item.id);

  if (existingIndex >= 0) {
    cart[existingIndex].quantity += item.quantity;
  } else {
    cart.push(item);
  }

  await setCart(sessionId, tenant, cart);
  return cart;
}

export async function removeFromCart(
  sessionId: string,
  tenant: string,
  itemId: string
): Promise<CartItem[]> {
  const cart = await getCart(sessionId, tenant);
  const updated = cart.filter(i => i.id !== itemId);
  await setCart(sessionId, tenant, updated);
  return updated;
}

export async function clearCart(
  sessionId: string,
  tenant: string
): Promise<void> {
  const key = keys.cart(tenant, sessionId);
  await redis.del(key);
}
```

### API Route para Carrito

```typescript
// app/api/cart/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCart, addToCart } from "@/lib/cart";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session-id')?.value || crypto.randomUUID();
  const tenant = req.nextUrl.searchParams.get('tenant') || 'default';

  const cart = await getCart(sessionId, tenant);

  return NextResponse.json(cart, {
    headers: {
      'Cache-Control': 'private, no-cache, no-store',
    },
  });
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session-id')?.value || crypto.randomUUID();
  const { tenant, item } = await req.json();

  const cart = await addToCart(sessionId, tenant, item);

  const response = NextResponse.json(cart);
  response.cookies.set('session-id', sessionId, {
    httpOnly: true,
    maxAge: 7200, // 2 horas
  });

  return response;
}
```

---

## 4. Rate Limiting por Tenant (Anti-Crawler)

### Implementación con Upstash Ratelimit

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// 200 requests por minuto por tenant
export const limiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(200, "1 m"),
  prefix: "rl",
});

export async function checkRateLimit(tenant: string, ip: string) {
  const { success, limit, reset, remaining } = await limiter.limit(
    `${tenant}:${ip}`
  );

  return {
    allowed: success,
    limit,
    remaining,
    resetAt: new Date(reset),
  };
}
```

### Middleware de Rate Limiting

```typescript
// middleware.ts (agregar a middleware existente)
import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const tenant = req.nextUrl.pathname.split('/')[2] || "default";
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';

  // Rate limiting
  const { allowed, limit, remaining, resetAt } = await checkRateLimit(tenant, ip);

  if (!allowed) {
    return NextResponse.json(
      {
        error: "Too many requests",
        limit,
        resetAt: resetAt.toISOString()
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': resetAt.toISOString(),
        }
      }
    );
  }

  // Headers de rate limit en respuesta exitosa
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());

  return response;
}
```

---

## 5. Sesiones (NextAuth + Redis)

### Opcional: Persistir Sesiones en Redis

```typescript
// lib/auth-options.ts
import { redis } from "./redis";
import type { NextAuthOptions } from "next-auth";
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter";

export const authOptions: NextAuthOptions = {
  adapter: UpstashRedisAdapter(redis),
  session: {
    strategy: "database",
    maxAge: 24 * 60 * 60, // 24 horas
  },
  // ... resto de configuración
};
```

---

## 6. Observabilidad y Monitoreo

### Dashboard de Métricas

```typescript
// lib/redis-metrics.ts
import { redis } from "./redis";

export async function getRedisMetrics() {
  // Obtener info del servidor (requiere comandos Redis directos)
  const info = await redis.info();

  return {
    memory: info.used_memory_human,
    connections: info.connected_clients,
    ops_per_sec: info.instantaneous_ops_per_sec,
    keyspace_hits: info.keyspace_hits,
    keyspace_misses: info.keyspace_misses,
    hit_rate: (
      (info.keyspace_hits / (info.keyspace_hits + info.keyspace_misses)) * 100
    ).toFixed(2) + '%',
  };
}
```

### Alertas Upstash

**Configurar en Upstash Dashboard:**

- **Ops/día > 20k**: Revisar qué estás cacheando (posible sobre-uso)
- **Hit rate < 70%**: Ajustar TTLs o revisar patrones de acceso
- **Memory > 80%**: Revisar TTLs o incrementar plan

---

## 7. Patrones Anti-Patterns

### ✅ Hacer:

```typescript
// Cachear slots de disponibilidad (alta rotación, TTL corto)
await redis.set(`av:wondernails:manicure:2025-10-09`, slots, { ex: 60 });

// Carrito temporal por sesión
await redis.set(`cart:vigi:session123`, cart, { ex: 7200 });

// Rate limiting por tenant
const { success } = await limiter.limit('wondernails:192.168.1.1');
```

### ❌ NO Hacer:

```typescript
// ❌ NO cachear catálogos completos en Redis
// Usar ISR + CDN en su lugar
await redis.set(`products:wondernails`, allProducts, { ex: 3600 });

// ❌ NO usar TTLs muy largos para datos que cambian
await redis.set(`slots:...`, slots, { ex: 86400 }); // 24h demasiado!

// ❌ NO olvidar keying por tenant
await redis.set('cart', cart); // Falta tenant ID!
```

---

## 8. TTLs Recomendados

| Tipo de Dato | TTL | Justificación |
|-------------|-----|---------------|
| **Disponibilidad/Slots** | 60-120s | Cambios frecuentes (reservas) |
| **Carrito** | 2h | Sesión temporal |
| **Sesión (NextAuth)** | 24h | Token refresh automático |
| **Rate Limiting** | 1m | Sliding window |
| **Catálogos** | ❌ No usar | Usar ISR + CDN |

---

## 9. Estrategia de Invalidación

### Por Evento (Event-Driven)

```typescript
// Cuando se crea una reserva
export async function onBookingCreated(
  tenant: string,
  serviceId: string,
  date: string
) {
  // Invalidar slots del día
  await redis.del(`av:${tenant}:${serviceId}:${date}`);

  // Opcional: purgar cache de Next.js
  await fetch('/api/revalidate', {
    method: 'POST',
    body: JSON.stringify({
      secret: process.env.REVALIDATE_SECRET,
      tags: [`services:${tenant}`]
    })
  });
}
```

---

## 10. Variables de Entorno

```bash
# .env.local
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
MONTHLY_BUDGET=5.00
```

---

## Resultado Esperado

- **Hit Rate**: > 70% para slots y carritos
- **Latencia**: < 50ms para operaciones Redis
- **Ops/día**: < 20k en plan gratuito
- **Memory**: < 256MB (plan gratuito)

---

**Última actualización**: 2025-10-08
**Versión**: 1.0.0
**Plan**: Upstash Free Tier (10k requests/day)
