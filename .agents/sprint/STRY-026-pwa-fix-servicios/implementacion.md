# Implementación — STRY-026

> Alcance de implementación enlazado a los CA de la US.
> Fuente de verdad de la spec: `docs/stories/active/STRY-026-pwa-instalable-fix-servicios-observabilidad.md`
> Plan operativo: `plan.md` (mismo directorio).

---

## Trazabilidad CA → código → tests

| CA | Descripción | Código afectado | Tests |
|----|-------------|-----------------|-------|
| CA-3 | Unificación DB / no fallback | `.env*`, `packages/database/connection.ts` | `tests/unit/database/connection.spec.ts` |
| CA-4 | Guardar/editar servicio (3 descripciones) | `app/t/[tenant]/admin_services/page.tsx`, `app/api/tenants/[tenant]/services/route.ts`, `app/api/tenants/[tenant]/services/[id]/route.ts` | UT services + E2E admin_services |
| CA-5 | Búsqueda sin error | `app/t/[tenant]/admin_services/page.tsx` (filtro client) | E2E búsqueda |
| CA-1 | Manifest dinámico por tenant | `app/t/[tenant]/manifest.webmanifest.ts` (nuevo), `app/t/[tenant]/layout.tsx`, `app/layout.tsx` | E2E PWA + UT manifest |
| CA-2 | SW offline + push | `public/sw.js`, `components/client-init.tsx`, `packages/database/schema.ts` (`push_subscriptions`), `app/api/tenants/[tenant]/push/{subscribe,unsubscribe}/route.ts` | UT push + E2E consent |
| CA-6 | Observabilidad | `apps/web/sentry.*.config.ts`, eliminar `SUPABASE_CREDENTIALS_GUIDE.md`, `check-services-schema.js` | smoke + grep secret scan |

---

## Detalle de cambios por componente

### 1. `packages/database/connection.ts` (A2)
- Quitar bloques `connectionString = "...localhost/dummy"` (líneas 8-14 y 107-112).
- En `getClient()`, si no hay `DATABASE_URL` (y no es test): lanzar/consologear `FATAL` y devolver client que **falla con mensaje claro** (no simule éxito).
- Mantener `TEST_DATABASE_URL` para tests.

### 2. Env unification (A1)
- Fijar `.env` (raíz) y `apps/web/.env.local` al mismo Supabase pooler.
- Borrar/reescribir `.env.local` (raíz) que apunta a `localhost:5432/sass_store_test`.
- Actualizar `.env.example` y `apps/web/.env.example` con comentario "fuente de verdad = Supabase prod".

### 3. Services PATCH/POST (A3)
- `updateServiceSchema` y `createServiceSchema`: añadir `shortDescription: z.string().max(140).optional()`, `longDescription: z.string().optional()`.
- En `.values({...})` mapear las 3 columnas.
- `admin_services/page.tsx`:
  - `Service` interface: añadir `shortDescription?`, `longDescription?`.
  - `handleEdit`: cargar las 3.
  - `handleSubmit`: enviar las 3.
  - Form: 2 textareas nuevas (short/long) o pestañas; decidir UX simple.
  - Tabla lista: mostrar `shortDescription || description || "Sin descripción"`.

### 4. Manifest dinámico (B1)
- `app/t/[tenant]/manifest.webmanifest.ts`:
  ```ts
  export const dynamic = "force-dynamic";
  export async function GET(req, { params }) {
    const { tenant } = await params;
    // leer tenant (nombre, logo, themeColor) vía tenant-service
    // construir manifest JSON
    return new Response(JSON.stringify(manifest), {
      headers: { "Content-Type": "application/manifest+json" },
    });
  }
  ```
- `app/t/[tenant]/layout.tsx` + `app/layout.tsx`: `<link rel="manifest" href={...}>` y `theme-color` meta.

### 5. Service worker (B3)
- `public/sw.js`: precache `/offline`, runtime cache network-first para HTML, cache-first para assets estáticos. Versionado `sw-v1`.
- Registro en `components/client-init.tsx`: `navigator.serviceWorker.register('/sw.js')` solo en producción (o siempre con guard).
- `app/offline/page.tsx`: fallback HTML.

### 6. Push subscriptions (B4)
- Schema: `pushSubscriptions` table (`id`, `tenantId`, `endpoint`, `p256dh`, `auth`, `userAgent?`, `createdAt`).
- Migration: `packages/database/migrations/`.
- `lib/push/pushService.ts` (Result Pattern): `subscribe(tenantId, payload)`, `unsubscribe(tenantId, endpoint)`.
- `app/api/tenants/[tenant]/push/subscribe/route.ts` + `unsubscribe/route.ts` con `withResultHandler` (o equivalente).
- Cliente: `components/push/push-opt-in.tsx` + VAPID public key vía `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.

### 7. Sentry (C1)
- `sentry.client.config.ts`: `beforeSend` añade `tags.tenant` desde `window.location.pathname`.
- `sentry.server.config.ts`: resolver tenant desde request/headers en hooks.
- Confirmar `SENTRY_DSN` y `SENTRY_AUTH_TOKEN` en env.

### 8. Secret cleanup (C2)
- `git rm SUPABASE_CREDENTIALS_GUIDE.md`.
- `check-services-schema.js`: usar `process.env.DATABASE_URL` (o mover a `scripts/` con `.gitignore`).
- Rotación: dueño cambia password Supabase → actualiza envs.

---

## Cobertura objetivo (≥80% en código nuevo)

- `connection.ts` (fallback removal): 100%
- `pushService.ts`: ≥90% (subscribe/unsubscribe, validation)
- manifest route: ≥80% (tenant encontrado / no encontrado)
- services PATCH/POST (lógica nueva de 3 descripciones): cubierto vía UT del service

## Deuda / fuera de alcance

- Refactor completo de `services` routes a Result Pattern (legacy) → otra US.
- Migración de todos los `.test.ts` legacy → otra US (STRY-018).
- Push sending real (cron worker) → STRY-006; aquí solo suscripción + infra.
