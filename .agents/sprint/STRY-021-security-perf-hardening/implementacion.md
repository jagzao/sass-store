# Implementación — STRY-021 Security & Performance Hardening

> Este documento es la guía de codificación completa. El agente implementador
> sigue cada fase en orden, ejecuta el pipeline de validación al final de cada
> fase, y actualiza el estado en `plan.md`.

---

## FASE 1 — Nuke endpoints de debug peligrosos

### Objetivo

Eliminar o blindar completamente los 3 endpoints que permiten verificar credenciales
sin autenticación o tienen datos hardcodeados.

---

### 1.1 Eliminar `GET /api/diagnose/user-check`

**Archivo a modificar:** `apps/web/app/api/diagnose/user-check/route.ts`

**Acción:** Reemplazar el contenido completo por un 404 incondicional.

```typescript
// apps/web/app/api/diagnose/user-check/route.ts
import { NextResponse } from "next/server";

// STRY-021 SEC-001: Endpoint eliminado — credential oracle
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
```

**Razón:** Este endpoint aceptaba `?email=x&password=y` en la URL (GET), verificaba
la contraseña con bcrypt, y confirmaba si el usuario existía. Es un oracle de
credenciales explotable sin ninguna autenticación.

---

### 1.2 Eliminar `GET /api/debug/auth-check`

**Archivo a modificar:** `apps/web/app/api/debug/auth-check/route.ts`

**Acción:** Reemplazar el contenido completo por un 404 incondicional.

```typescript
// apps/web/app/api/debug/auth-check/route.ts
import { NextResponse } from "next/server";

// STRY-021 SEC-002: Endpoint eliminado — credenciales hardcodeadas + stack traces
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
```

**Razón:** Tenía `email = "marialiciavh1984@gmail.com"` y `password = "admin"`
hardcodeados. Además devolvía `error.stack` completo en respuestas 500.

---

### 1.3 Sanear `POST /api/debug/seed-e2e`

**Archivo a modificar:** `apps/web/app/api/debug/seed-e2e/route.ts`

**Cambios exactos:**

1. Cambiar el `TEST_USER` para no usar el email real del owner:

```typescript
// ANTES (líneas 17-22):
const TEST_USER = {
  id: "e2e-test-user-001",
  name: "E2E Admin",
  email: "jagzao@gmail.com", // ← email real del owner
  password: "admin", // ← contraseña trivial
};

// DESPUÉS:
const TEST_USER = {
  id: "e2e-test-user-001",
  name: "E2E Admin",
  email: process.env.E2E_TEST_USER_EMAIL ?? "e2e-admin@test.internal",
  password: process.env.E2E_TEST_USER_PASSWORD ?? "e2e-test-password-change-me",
};
```

2. Agregar validación de token también para el POST en staging:

```typescript
// Al inicio del handler POST, después de la comprobación de NODE_ENV:
export async function POST(request: NextRequest) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // STRY-021: Require token even in dev/staging to avoid accidental admin reset
  const expectedToken = process.env.E2E_SEED_SECRET;
  if (expectedToken) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token || token !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // ... resto del handler sin cambios
```

3. Agregar al archivo `.env.example`:

```
# E2E Testing — solo para entornos no-producción
E2E_TEST_USER_EMAIL="e2e-admin@test.internal"
E2E_TEST_USER_PASSWORD="change-me-in-env-local"
E2E_SEED_SECRET="generate-with-openssl-rand-hex-32"
```

**Nota para el agente:** Actualizar también `tests/e2e/` si hay algún test que pase
credenciales hardcodeadas al seed endpoint — verificar con grep antes de cerrar la fase.

---

## FASE 2 — Middleware hardening: tenant UUID + API protection + internal header

### 2.1 Corregir tenant ID para usar UUID real (SEC-005)

**Archivo:** `apps/web/middleware.ts`

**Problema actual:** `buildTenantResponse()` retorna `id: slug` (string legible)
en lugar del UUID real de la base de datos. Esto hace que `x-tenant-id` en headers
sea el slug, no el UUID, rompiendo cualquier validación RLS downstream.

**Solución:** Crear un mapa estático de slug → UUID que refleje la BD, hasta que
se implemente la consulta real en middleware. Este mapa debe coincidir exactamente
con los UUIDs en la tabla `tenants`.

```typescript
// En middleware.ts, reemplazar buildTenantResponse():

// STRY-021 SEC-005: UUIDs reales de tenant. Mantener sincronizado con la BD.
// En producción a futuro: consultar desde Redis caché en el edge.
const TENANT_UUID_MAP: Record<string, string> = {
  wondernails: process.env.TENANT_UUID_WONDERNAILS ?? "wondernails",
  "centro-tenistico":
    process.env.TENANT_UUID_CENTRO_TENISTICO ?? "centro-tenistico",
  delirios: process.env.TENANT_UUID_DELIRIOS ?? "delirios",
  "manada-juma": process.env.TENANT_UUID_MANADA_JUMA ?? "manada-juma",
  "zo-system": process.env.TENANT_UUID_ZO_SYSTEM ?? "zo-system",
};

function buildTenantResponse(slug: string): FullResolvedTenant {
  const tenantModes: Record<string, "catalog" | "booking"> = {
    wondernails: "booking",
    "centro-tenistico": "booking",
    delirios: "catalog",
    "manada-juma": "booking",
    "zo-system": "catalog",
  };

  return {
    id: TENANT_UUID_MAP[slug] ?? slug, // ← usa UUID real si está disponible
    slug,
    source: "fallback",
    featureMode: tenantModes[slug] || "catalog",
    locale: "es-MX",
    currency: "MXN",
  };
}
```

Agregar al `.env.example`:

```
# UUIDs de tenant — obtener con: SELECT id, slug FROM tenants;
TENANT_UUID_WONDERNAILS=""
TENANT_UUID_CENTRO_TENISTICO=""
TENANT_UUID_DELIRIOS=""
TENANT_UUID_MANADA_JUMA=""
TENANT_UUID_ZO_SYSTEM=""
```

**Nota:** El agente debe obtener los UUIDs reales ejecutando:

```sql
-- En Supabase dashboard o via MCP:
SELECT id, slug FROM tenants ORDER BY slug;
```

Y documentar los valores en `implementacion.md` (sección "UUIDs registrados").

---

### 2.2 Incluir /api/\* en el matcher del middleware (SEC-004)

**Archivo:** `apps/web/middleware.ts`

**Problema:** El matcher excluye `/api/*`, lo que significa que las rutas API no
reciben los headers de tenant, ni la validación CSRF, ni la validación de origen.

**Cambio en el matcher:**

```typescript
// ANTES (final del archivo):
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|tenants).*)"],
};

// DESPUÉS:
export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto assets estáticos de Next.js.
     * /api/* ahora INCLUIDO para que reciban headers de tenant y CSRF.
     * Excluir solo assets:
     */
    "/((?!_next/static|_next/image|favicon.ico|tenants/).*)",
  ],
};
```

**Impacto en el middleware:** Con las APIs dentro del matcher, hay que asegurarse
de que el CSRF check no bloquee llamadas API legítimas que no lo necesitan.

**Modificar la sección de CSRF (Step 4) en el middleware:**

```typescript
// STEP 4: CSRF Protection
// Excluir rutas API públicas que usan sus propios mecanismos de autenticación
const isApiRoute = pathname.startsWith("/api/");
const isWebhookRoute =
  pathname.startsWith("/api/whatsapp/webhook") ||
  pathname.startsWith("/api/internal/");

if (!isCsrfExempt(pathname) && !isWebhookRoute) {
  if (CSRF_PROTECTED_METHODS.includes(method)) {
    // ... lógica CSRF existente sin cambios
  }
}
```

**Verificar que `isCsrfExempt()` en `@sass-store/core` cubra los endpoints
que no necesitan CSRF** (ej: callbacks OAuth, webhooks externos). Si no los cubre,
agregarlos a la lista de exempciones.

---

### 2.3 Remover detección de "servicio interno" por header falseable (SEC-006)

**Archivo:** `apps/web/middleware.ts`

```typescript
// ANTES (líneas ~352-365):
const tenantHeader = request.headers.get("x-tenant");
const isInternalRequest =
  request.headers.get("x-internal-request") === "true" ||
  request.headers.get("user-agent")?.includes("internal-service");

if (tenantHeader && isInternalRequest && KNOWN_TENANTS.includes(tenantHeader)) {
  return { tenant: buildTenantResponse(tenantHeader), source: "header" };
}

// DESPUÉS — eliminar completamente el bloque Priority 3:
// Priority 3 (ELIMINADO): x-internal-request era falseable.
// Las llamadas servicio-a-servicio deben usar path /t/{tenant}/ o subdomain.
// Si se necesita en el futuro: implementar con JWT firmado o IP allowlist.
```

---

## FASE 3 — Integraciones externas seguras

### 3.1 Verificación HMAC-SHA256 en webhook de WhatsApp (SEC-007)

**Archivo:** `apps/web/app/api/whatsapp/webhook/route.ts`

**Agregar verificación de firma antes de procesar el POST:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
// ... imports existentes

/**
 * Verifica la firma HMAC-SHA256 que Meta incluye en X-Hub-Signature-256.
 * Docs: https://developers.facebook.com/docs/messenger-platform/webhooks#validate-payloads
 */
async function verifyMetaSignature(
  request: NextRequest,
  rawBody: string,
): Promise<boolean> {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    // Si no está configurado, skip en desarrollo, rechazar en producción
    if (process.env.NODE_ENV === "production") {
      console.error("[WhatsApp Webhook] WHATSAPP_APP_SECRET no configurado");
      return false;
    }
    return true; // dev sin secret configurado — permitir
  }

  const signature = request.headers.get("x-hub-signature-256");
  if (!signature?.startsWith("sha256=")) {
    return false;
  }

  const expectedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", appSecret)
      .update(rawBody, "utf8")
      .digest("hex");

  // Comparación timing-safe para evitar timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

// Modificar el handler POST:
export async function POST(request: NextRequest) {
  try {
    // Leer body como texto primero para poder verificar firma
    const rawBody = await request.text();

    // STRY-021 SEC-007: Verificar firma HMAC de Meta
    const isValid = await verifyMetaSignature(request, rawBody);
    if (!isValid) {
      console.warn("[WhatsApp Webhook] Firma inválida — request rechazado");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parsear JSON después de verificar
    const body = JSON.parse(rawBody);

    // STRY-021 PERF-007: Log reducido — sin PII, sin pretty-print
    console.log("[WhatsApp Webhook] Recibido:", {
      object: body.object,
      entryCount: body.entry?.length ?? 0,
    });

    // ... resto del handler sin cambios
```

Agregar al `.env.example`:

```
# WhatsApp — App Secret para verificación HMAC del webhook
# Obtener en: Meta Developer → App → Settings → Basic → App Secret
WHATSAPP_APP_SECRET="your-app-secret"
```

---

### 3.2 Autenticación en endpoint de upload (SEC-008)

**Archivo:** `apps/web/app/api/upload/route.ts`

**Agregar auth check al inicio del handler:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
// ... imports existentes

export async function POST(request: NextRequest) {
  // STRY-021 SEC-008: Requiere sesión autenticada
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    // ... resto sin cambios hasta el fallback base64

    // STRY-021 PERF-008: Rechazar si Cloudinary no está configurado
    // en lugar de devolver base64 enorme en respuesta
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json(
        {
          error: "Upload service not configured",
          message: "Cloudinary credentials missing. Contact administrator.",
        },
        { status: 503 },
      );
    }

    // ... solo el bloque de Cloudinary, eliminar el fallback base64
```

**Eliminar completamente el bloque del fallback base64** (líneas ~89-98 del original).
Si Cloudinary no está configurado, la operación debe fallar con 503, no devolver
un payload de varios MB.

---

## FASE 4 — CSP hardening + diagnose endpoints

### 4.1 Hardening de endpoints de diagnóstico (SEC-009)

**Archivos a modificar:**

- `apps/web/app/api/diagnose/env/route.ts`
- `apps/web/app/api/diagnose/route.ts` (el principal que expone DB URL preview)
- `apps/web/app/api/diagnose/comprehensive/route.ts`
- `apps/web/app/api/diagnose/auth/route.ts`
- `apps/web/app/api/diagnose/user-check/route.ts` (ya eliminado en Fase 1)
- `apps/web/app/api/debug/route.ts`

**Acción para cada uno:** Agregar un guard que exija un token secreto de diagnóstico,
además del check de `NODE_ENV`:

```typescript
// Helper reutilizable — crear en apps/web/lib/api/diagnose-auth.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * Protege endpoints de diagnóstico.
 * Retorna NextResponse de error si no autorizado, null si OK.
 */
export function requireDiagnoseAuth(request: NextRequest): NextResponse | null {
  // Solo disponible fuera de producción
  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // En staging/preview, exigir token de diagnóstico
  if (
    process.env.VERCEL_ENV === "preview" ||
    process.env.REQUIRE_DIAGNOSE_AUTH === "true"
  ) {
    const token =
      request.headers.get("x-diagnose-token") ??
      request.nextUrl.searchParams.get("diagnose_token");
    const expected = process.env.DIAGNOSE_SECRET_TOKEN;

    if (!expected) {
      return NextResponse.json(
        { error: "Diagnose not configured" },
        { status: 503 },
      );
    }

    if (!token || token !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return null; // Autorizado
}
```

**Modificar cada endpoint de diagnóstico:**

```typescript
// En cada archivo de diagnose:
import { requireDiagnoseAuth } from "@/lib/api/diagnose-auth";

export async function GET(request: NextRequest) {
  const authError = requireDiagnoseAuth(request);
  if (authError) return authError;

  // ... lógica existente
```

**Para `apps/web/app/api/diagnose/route.ts` específicamente:**
Eliminar la línea que expone el preview de DATABASE_URL:

```typescript
// ELIMINAR esta línea:
DATABASE_URL_preview: process.env.DATABASE_URL?.substring(0, 30) + "...",
// La presencia se indica solo con booleano:
DATABASE_URL_set: !!process.env.DATABASE_URL,
```

**Para `apps/web/app/api/debug/route.ts`:**
Eliminar la exposición de las primeras 10 letras del Client ID:

```typescript
// ELIMINAR:
clientIdPreview: process.env.GOOGLE_CALENDAR_CLIENT_ID?.substring(0, 10),
publicClientIdPreview: process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID?.substring(0, 10),
// REEMPLAZAR con booleanos:
hasClientId: !!process.env.GOOGLE_CALENDAR_CLIENT_ID,
hasPublicClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID,
```

Agregar al `.env.example`:

```
# Diagnose endpoints — token para acceso en staging/preview
DIAGNOSE_SECRET_TOKEN="generate-with-openssl-rand-hex-32"
REQUIRE_DIAGNOSE_AUTH="false"  # Setear true en staging
```

---

### 4.2 CSP: eliminar unsafe-inline de script-src con nonce (SEC-010)

**Archivo:** `apps/web/next.config.js`

**Problema:** MercadoPago requiere inline scripts, pero se puede usar nonce en
lugar de `unsafe-inline` global. Sin embargo, en Next.js App Router implementar
nonce requiere middleware + `generateStaticParams`. La solución pragmática para
esta US es:

1. Agregar un comentario explícito documentando la limitación
2. Mover `unsafe-inline` detrás de una variable de entorno para poder desactivarlo
   en tenants que NO usan pagos
3. Agregar `strict-dynamic` que limita el scope de `unsafe-inline` en navegadores modernos

```javascript
// En generateCSP(), en el bloque else (producción):
} else {
  // NOTE STRY-021 SEC-010: MercadoPago requiere 'unsafe-inline'.
  // Mitigado con strict-dynamic (navegadores modernos ignoran unsafe-inline
  // cuando strict-dynamic está presente, excepto para scripts literales).
  // TODO: Implementar nonce completo en STRY-022 cuando se migre MP a SDK v2.
  directives['script-src'].push(
    "'unsafe-inline'",      // Requerido por MercadoPago SDK v1
    "'strict-dynamic'",     // Mitiga el impacto de unsafe-inline en browsers modernos
  );
  // Agregar nonce support para scripts propios (preparatorio para STRY-022)
  if (process.env.NEXT_PUBLIC_USE_CSP_NONCE === "true") {
    // El nonce real se genera en el middleware y se inyecta aquí
    // Esta preparación permite la migración gradual
    directives['script-src'] = directives['script-src'].filter(
      (d: string) => d !== "'unsafe-inline'"
    );
  }
  directives['upgrade-insecure-requests'] = [];
}
```

---

## FASE 5 — Performance: hot paths

### 5.1 Eliminar DB call del middleware — JWT-only verification (PERF-001)

**Archivo:** `apps/web/middleware.ts`

**Problema:** `getSessionTenant()` llama a `verifyAuthToken()` en cada request.
Si esa función consulta la BD para validar tokens (revocation check), es una
consulta DB por request en el edge.

**Verificar primero:** Leer `@sass-store/core/src/middleware/auth-middleware.ts`
para entender qué hace `verifyAuthToken`. Si solo verifica la firma JWT sin DB:
no hay problema. Si consulta la BD: es crítico.

**Si `verifyAuthToken` consulta la BD:**

```typescript
// Opción A: Usar solo verificación de firma JWT local (sin revocation check)
// en el middleware del edge, y delegar la revocation check a las rutas protegidas.

async function getSessionTenant(
  request: NextRequest,
): Promise<AuthenticatedTenantContext | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      // STRY-021 PERF-001: Solo verificación de firma JWT, sin DB call
      // La revocation check ocurre en las rutas que lo necesiten
      const verifyResult = await verifyAuthTokenSignatureOnly(token);
      if (verifyResult.success) {
        return createTenantContextFromJWT(verifyResult.data);
      }
    }

    // Para sesiones web, NextAuth ya valida la sesión — solo extraer datos del JWT
    const sessionToken =
      extractCookieValue(
        request.headers.get("cookie") || "",
        "next-auth.session-token",
      ) ??
      extractCookieValue(
        request.headers.get("cookie") || "",
        "__Secure-next-auth.session-token",
      );

    if (sessionToken) {
      // Decodificar sin verificar — la verificación la hace NextAuth en las rutas
      // El middleware solo necesita saber el tenant del usuario, no su autorización
      const decoded = decodeJwtPayload(sessionToken);
      if (decoded?.tenantSlug) {
        return {
          userId: decoded.sub,
          tenantId: decoded.tenantId,
          tenantSlug: decoded.tenantSlug,
          role: decoded.role,
        } as AuthenticatedTenantContext;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Helper para decodificar sin verificar (solo para middleware/edge):
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}
```

**Si `verifyAuthToken` no consulta la BD:** Documentarlo en un comentario y marcar
PERF-001 como no-issue.

---

### 5.2 Limpiar console.warn del hot path de TenantService (PERF-002)

**Archivo:** `apps/web/lib/db/tenant-service.ts`

**Reemplazar todos los `console.warn` de debug por el logger con nivel correcto:**

```typescript
// Agregar import al inicio:
import { tenantLogger } from "@/lib/logger";

// Reemplazar TODOS los console.warn de desarrollo por tenantLogger.debug:
// ANTES: console.warn(`[TenantService] Fetching tenant from database: ${slug}`);
// DESPUÉS: tenantLogger.debug(`[TenantService] fetch`, { slug });

// ANTES: console.warn(`[TenantService] Found tenant in database: ${tenantData.name}`);
// DESPUÉS: tenantLogger.debug(`[TenantService] found`, { name: tenantData.name });

// Los console.error de errores reales → tenantLogger.error (mantener)
// Los console.warn de "n items found" → eliminar completamente
```

**Criterio:**

- `console.warn` de "fetching / found / loaded X items" → eliminar
- `console.error` de errores reales → reemplazar por `tenantLogger.error`
- Dejar UN solo log por operación de fetch (no 5-6 por función)

**Aplicar el mismo criterio a:**

- `apps/web/lib/db/tenant-service-cached.ts` (si tiene logs)
- `apps/web/lib/db/connection.ts` — los `console.warn("[DB] Connecting to host...")` en producción

---

## FASE 6 — Caché y rate limiting distribuido

### 6.1 Unificar las capas de caché de tenant (PERF-003)

**Problema actual:** Existe triple capa:

1. `TenantCache` (in-memory LRU en `tenant-service.ts`)
2. `getOrSetCache` (Redis en `tenant-service.ts`)
3. `CachedTenantService` en `tenant-service-cached.ts` (llama a TenantService)

**La capa 3 es un wrapper sobre la capa 1+2 que duplica la lógica.**

**Solución:**

```typescript
// apps/web/lib/db/tenant-service-cached.ts
// SIMPLIFICAR: delegar completamente a TenantService que ya tiene caché dual

export const CachedTenantService = {
  async getTenantWithData(slug: string) {
    // TenantService ya maneja: memory cache → Redis → DB
    return TenantService.getTenantWithData(slug);
  },

  async getProducts(tenantSlug: string) {
    const data = await TenantService.getTenantWithData(tenantSlug);
    return data?.products ?? [];
  },

  async getServices(tenantSlug: string) {
    const data = await TenantService.getTenantWithData(tenantSlug);
    return data?.services ?? [];
  },

  async invalidateCache(tenantSlug: string) {
    // Invalidar ambas capas
    TenantCache.delete(`tenant_with_data_${tenantSlug}`);
    await deleteCache(CacheKeys.tenantWithData(tenantSlug));
  },
};
```

**Asegurar invalidación coordinada:** En cualquier API route que actualice datos
de tenant (branding, services, etc.), llamar a:

```typescript
await CachedTenantService.invalidateCache(tenantSlug);
```

Verificar con grep que las rutas de actualización de branding/services lo hagan.

---

### 6.2 Rate limiter basado en Redis (Upstash) (PERF-004)

**Archivo:** `apps/web/lib/security/rate-limiter.ts`

**Problema:** `const rateLimitStore = new Map()` — no persiste entre instancias
serverless. Un atacante distribuido nunca alcanza el límite.

**Solución:** Usar Upstash Redis con sliding window, que ya es la dependencia
instalada para caché.

```typescript
// apps/web/lib/security/rate-limiter.ts — NUEVA VERSIÓN COMPLETA

import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

function getRedis(): Redis | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.UPSTASH_REDIS_URL?.trim();
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = getRedis();

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  blocked: boolean;
  blockReason?: string;
}

/**
 * Sliding window rate limiter usando Upstash Redis.
 * Funciona en serverless/edge — estado compartido entre instancias.
 * Fallback: permite la request si Redis no está disponible (fail-open).
 */
async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  if (!redis) {
    // Sin Redis: fail-open con advertencia
    console.warn(
      "[RateLimit] Redis no configurado — rate limiting desactivado",
    );
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: 0,
      blocked: false,
    };
  }

  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = now - windowMs;

  try {
    // Sliding window con sorted set:
    // 1. Eliminar entradas fuera de la ventana
    // 2. Contar entradas en la ventana
    // 3. Si < max, agregar la request actual
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zcard(key);
    pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    pipeline.expire(key, windowSeconds + 1);

    const results = await pipeline.exec();
    const count = (results[1] as number) ?? 0;

    if (count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + windowMs,
        blocked: true,
        blockReason: "Rate limit exceeded",
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - count - 1),
      resetTime: now + windowMs,
      blocked: false,
    };
  } catch (error) {
    console.error("[RateLimit] Redis error:", error);
    // Fail-open: permitir la request si Redis falla
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: 0,
      blocked: false,
    };
  }
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

// API pública compatible con el código existente
export class AdvancedRateLimiter {
  private maxRequests: number;
  private windowSeconds: number;
  private identifier: string;

  constructor(config: {
    windowMs: number;
    maxRequests: number;
    blockDurationMs?: number;
    identifier?: string;
  }) {
    this.maxRequests = config.maxRequests;
    this.windowSeconds = Math.floor(config.windowMs / 1000);
    this.identifier = config.identifier ?? "rl";
  }

  async checkLimit(
    request: NextRequest,
    identifier?: string,
  ): Promise<RateLimitResult> {
    const ip = getClientIP(request);
    const key = `ratelimit:${identifier ?? this.identifier}:${ip}`;
    return checkRateLimit(key, this.maxRequests, this.windowSeconds);
  }

  // Mantener API compatible — estos ya no hacen nada (Redis maneja la expiración)
  cleanup(): void {}
  blockIP(_ip: string): void {}
  unblockIP(_ip: string): void {}
}

export const authRateLimiter = new AdvancedRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  identifier: "auth",
});

export const apiRateLimiter = new AdvancedRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
  identifier: "api",
});

export const configRateLimiter = new AdvancedRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  identifier: "config",
});
```

**Eliminar** el `setInterval` de limpieza del final del archivo original —
ya no es necesario porque Redis con TTL maneja la expiración automáticamente.

---

## FASE 7 — Misc rendimiento: force-dynamic y health check

### 7.1 Auditar y quitar force-dynamic innecesario (PERF-005)

**Archivos que tienen `export const dynamic = "force-dynamic"` pero no necesitan
consultar datos que cambien en cada request:**

Verificar ruta por ruta con este criterio:

- **MANTENER** `force-dynamic`: rutas que leen datos de usuario, carrito, sesión,
  o datos que cambian con frecuencia (bookings, finance, etc.)
- **ELIMINAR** `force-dynamic`: rutas de diagnóstico/debug que no tienen datos
  dinámicos de usuario, o rutas que sirven datos estáticos de configuración

Rutas candidatas a quitar `force-dynamic` (verificar cada una):

- `apps/web/app/api/diagnose/env/route.ts` — solo lee env vars, puede ser estático
- `apps/web/app/api/diagnose/db/route.ts` — dev only, no necesita ser dinámico
- `apps/web/app/api/test-tenant/route.ts` — test route

**Criterio de decisión:** Si la ruta hace `db.select()` o lee sesión → mantener.
Si solo lee `process.env.*` o hace lógica estática → quitar.

---

### 7.2 Health check sin nueva conexión TCP (PERF-006)

**Archivo:** `apps/web/lib/db/connection.ts`

**Problema:** `checkDatabaseConnection()` crea una nueva conexión postgres solo
para hacer `SELECT 1` y luego la cierra.

```typescript
// ANTES:
export async function checkDatabaseConnection(): Promise<boolean> {
  // ...
  const client = postgres(connectionString, { max: 1 }); // nueva conexión
  await client`SELECT 1`;
  await client.end();
  // ...
}

// DESPUÉS: reusar la conexión existente del pool
export async function checkDatabaseConnection(): Promise<boolean> {
  if (!connectionString) return false;

  try {
    // Usar el db singleton existente, no crear nueva conexión
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error("[DB] Health check failed:", error);
    return false;
  }
}
```

**Nota:** Importar `sql` de `drizzle-orm` si no está importado.

---

## Tests a crear o actualizar

El agente debe crear/actualizar en `tests/e2e/` un archivo:
`tests/e2e/security/stry-021-security.spec.ts`

Casos a cubrir:

```typescript
test.describe("STRY-021 Security Hardening", () => {
  test("SEC-001: /api/diagnose/user-check returns 404", async ({ request }) => {
    const res = await request.get(
      "/api/diagnose/user-check?email=test@test.com&password=admin",
    );
    expect(res.status()).toBe(404);
  });

  test("SEC-002: /api/debug/auth-check returns 404", async ({ request }) => {
    const res = await request.get("/api/debug/auth-check");
    expect(res.status()).toBe(404);
  });

  test("SEC-008: /api/upload without auth returns 401", async ({ request }) => {
    const res = await request.post("/api/upload", {
      multipart: {
        file: Buffer.from("test"),
        fileName: "test.jpg",
        mimeType: "image/jpeg",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("SEC-007: /api/whatsapp/webhook without signature returns 401", async ({
    request,
  }) => {
    // Solo aplica si WHATSAPP_APP_SECRET está configurado
    const res = await request.post("/api/whatsapp/webhook", {
      data: { object: "whatsapp_business_account", entry: [] },
    });
    // En dev sin secret configurado: 200. En prod/staging: 401
    expect([200, 401]).toContain(res.status());
  });

  test("PERF-002: Tenant service logs are not excessive", async ({ page }) => {
    // Verificar que navegar a una ruta de tenant no produce 19+ logs
    const consoleLogs: string[] = [];
    page.on("console", (msg) => consoleLogs.push(msg.text()));
    await page.goto("/t/wondernails");
    const tenantServiceLogs = consoleLogs.filter((l) =>
      l.includes("[TenantService]"),
    );
    expect(tenantServiceLogs.length).toBeLessThan(5);
  });
});
```

---

## Checklist de cierre del agente

Antes de crear el PR, verificar:

- [ ] `npm run lint` → 0 errores
- [ ] `npm run typecheck` → 0 errores
- [ ] `npm run build` → exitoso
- [ ] `npm run test:unit` → 0 fallos
- [ ] `npm run test:e2e:subset -- --grep "STRY-021"` → 0 fallos
- [ ] Los 3 endpoints críticos (SEC-001, SEC-002) devuelven 404
- [ ] Upload sin sesión devuelve 401
- [ ] WhatsApp webhook sin firma devuelve 401 (o 200 si no hay APP_SECRET configurado)
- [ ] No hay `console.warn` de "fetching / found / loaded" en tenant-service.ts
- [ ] `.env.example` actualizado con todas las nuevas variables
- [ ] `plan.md` actualizado con estado ✓ en todas las fases

## Variables de entorno nuevas (resumen)

```env
# Fase 1 — E2E seed
E2E_TEST_USER_EMAIL="e2e-admin@test.internal"
E2E_TEST_USER_PASSWORD="change-me"
E2E_SEED_SECRET=""

# Fase 2 — Tenant UUIDs
TENANT_UUID_WONDERNAILS=""
TENANT_UUID_CENTRO_TENISTICO=""
TENANT_UUID_DELIRIOS=""
TENANT_UUID_MANADA_JUMA=""
TENANT_UUID_ZO_SYSTEM=""

# Fase 3 — WhatsApp
WHATSAPP_APP_SECRET=""

# Fase 4 — Diagnose
DIAGNOSE_SECRET_TOKEN=""
REQUIRE_DIAGNOSE_AUTH="false"
```
