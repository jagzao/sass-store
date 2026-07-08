# Plan — STRY-026: PWA instalable + fix servicios + observabilidad

> **Estado:** listo para Architect → Dev → QA
> **Spec:** `docs/stories/active/STRY-026-pwa-instalable-fix-servicios-observabilidad.md`
> **DoD:** ver `AGENTS.md` § 1.2. **Barrera del agente:** § 1.3.

---

## Asunciones / defaults (aceptadas por el dueño)

Respuesta del dueño a la lista de 10 asunciones: **"0"** (ninguna a refinar → todas aceptadas). Resumen:

1. Unificar a **una sola DB** (Supabase prod). Eliminar `.env.local` raíz → localhost.
2. **Quitar fallback silencioso** a `localhost/dummy` en `connection.ts` → `ConfigurationError`.
3. "Error al buscar" = **síntoma del bug de DB**; reproducir en runtime; si hay error de UI, arreglar.
4. **Manifest dinámico** por tenant desde la DB (logo, nombre, colores).
5. **Service worker offline** (SW manual o `next-pwa` según compatibilidad Next 16).
6. **Push notifications** web-push + VAPID (relaciona STRY-006).
7. **Rotar credenciales** Supabase expuestas + borrar `SUPABASE_CREDENTIALS_GUIDE.md`.
8. **Análisis de errores reales** → **bloqueado por credenciales del dueño** (Sentry dashboard / logs Vercel). Sin eso solo mejoro el código.
9. **Result Pattern obligatorio** en lógica nueva; refactor de routes legacy de servicios **fuera de alcance**.
10. **Una sola US STRY-026** agrupa los 4 temas.

**Credencial estándar:** `jagzao@gmail.com` / `admin` en cada slug.

---

## Diagnóstico de causas raíz (ya investigado)

| # | Síntoma | Causa raíz | Archivo |
|---|---------|-----------|---------|
| A | Servicios no se guardan / datos viejos | `.env.local` (raíz) → `localhost:5432/sass_store_test`; scripts `db:*` leen raíz, app lee `apps/web/.env.local` | `.env.local`, `apps/web/.env.local` |
| B | Fallback silencioso a DB fantasma | `connection.ts:8-14` cae a `localhost/dummy` sin error | `packages/database/connection.ts` |
| C | Descripción errónea al editar | `admin_services` + PATCH route solo usan `description`; `SmartPublishWizard` escribe `shortDescription`/`longDescription` | `app/t/[tenant]/admin_services/page.tsx`, `app/api/tenants/[tenant]/services/[id]/route.ts`, `app/api/smart-publish/save/route.ts` |
| D | No instalable | Sin web manifest, sin SW | `app/layout.tsx`, raíz `manifest.json` (metadata, no PWA) |
| E | Error al buscar | Síntoma de A/B (carga falla) — búsqueda es client-side (`page.tsx:51`, filtro ≥3 chars) | `admin_services/page.tsx` |
| F | Sin observabilidad curada | Sentry existe pero sin tags por tenant; además fuga de credenciales | `sentry.*.config.ts`, `SUPABASE_CREDENTIALS_GUIDE.md` |

---

## Orden de trabajo numerado

### TRAMO A — Fix DB + servicios (bloqueante, primero)

#### A1. Unificar `DATABASE_URL`
- **Archivos:** `.env.local` (raíz), `.env`, `apps/web/.env.local`, `.env.example`, `apps/web/.env.example`
- **Acción:** Eliminar `.env.local` de la raíz (apunta a localhost) o reescribirlo a Supabase prod idéntico al de `apps/web/.env.local`. Asegurar que **un único destino** existe. Documentar en `.env.example` cuál es la fuente de verdad.
- **Hecho cuando:** `grep DATABASE_URL` en todos los `.env*` activos apunta al mismo host (Supabase pooler). No queda `localhost` en prod.
- **Riesgo:** Si algún script depende del localhost para tests locales → usar `TEST_DATABASE_URL` (ya existe en `connection.ts:79`).

#### A2. Quitar fallback silencioso en `connection.ts`
- **Archivo:** `packages/database/connection.ts:8-14` y `:107-112`
- **Acción:** Reemplazar el caer a `localhost/dummy` por lanzar/registrarse como error. Conservar el dummy **solo** en `NODE_ENV=test`. Crear `ConfigurationError` (DomainError) o reusar existente.
- **Hecho cuando:** app sin `DATABASE_URL` → log explícito `[DB] FATAL: DATABASE_URL no configurada` y las queries fallan con error claro (no datos fantasma).
- **Tests:** `tests/unit/database/connection.spec.ts` — fallback removido en prod.

#### A3. Fix descripción en `admin_services` + PATCH route
- **Archivos:**
  - `app/t/[tenant]/admin_services/page.tsx` — form con campos `description`, `shortDescription`, `longDescription`
  - `app/api/tenants/[tenant]/services/[id]/route.ts` — `updateServiceSchema` acepta las 3 descripciones
  - `app/api/tenants/[tenant]/services/route.ts` (POST) — `createServiceSchema` acepta las 3
  - `handleEdit`/`handleSubmit` en la página — mapear las 3 descripciones
- **Acción:** El form de admin debe mostrar y editar las 3 columnas. La lista tabla muestra `shortDescription` (más breve) o `description` con fallback.
- **Hecho cuando:** un servicio creado por SmartPublishWizard, al abrirlo en admin, muestra el texto correcto; al guardar no se pierde.
- **Tests:** UT del service + E2E del flujo crear/editar.

#### A4. Reproducir "error al buscar"
- **Acción:** Levantar dev (`npm run dev`), ir a `/t/wondernails/admin_services`, buscar. Si tras A1-A3 sigue fallando → inspeccionar consola/red, fijar causa concreta (probable mismatch de tipos `duration` decimal vs number, o carga fallida). La búsqueda client-side (`page.tsx:51`) en sí no debe lanzar.
- **Hecho cuando:** buscar "manicura" no genera error y filtra correctamente.

### TRAMO B — PWA instalable

#### B1. Manifest dinámico por tenant
- **Archivo nuevo:** `app/t/[tenant]/manifest.webmanifest.ts` (route handler que devuelve JSON con `Content-Type: application/manifest+json`).
- **Datos:** nombre, `short_name`, `description`, `theme_color`, `background_color`, `icons[]` (192 y 512, maskable), `display: standalone`, `start_url: /t/[tenant]`, `id`.
- **Fuente:** `tenants` table (logo, nombre, colores). Fallback a logo/colores por defecto si el tenant no los tiene.
- **Layout:** enlazar `<link rel="manifest" href="/t/[tenant]/manifest.webmanifest">` en `app/t/[tenant]/layout.tsx` + `app/layout.tsx` (default).
- **Hecho cuando:** `GET /t/wondernails/manifest.webmanifest` devuelve JSON válido con theme_color e íconos del tenant; Lighthouse detecta installable.

#### B2. Íconos por tenant
- **Acción:** Generar variantes 192/512/maskable del logo del tenant. Si el tenant ya tiene logo (R2/URL), servir derivados vía `next/image` o un endpoint de ícono. Fallback a un ícono genérico si no hay logo.
- **Hecho cuando:** manifest referencia íconos que responden 200.

#### B3. Service worker offline
- **Archivos:** `public/sw.js` (SW con estrategias: precache de rutas públicas, runtime cache, fallback offline) + registro en `app/layout.tsx` (client component) o `components/client-init.tsx`.
- **Decisión técnica (Architect):** `next-pwa` vs SW manual. Si `next-pwa` no soporta Next 16 → SW manual (más control).
- **Hecho cuando:** tras primera visita, `/t/wondernails` carga offline (página o fallback).
- **Riesgo:** SW mal configurado puede cachear contenido stale → usar versionado en cache name y `skipWaiting`.

#### B4. Push notifications
- **Schema nuevo:** tabla `push_subscriptions` (`id`, `tenantId`, `endpoint`, `p256dh`, `auth`, `userAgent`, `createdAt`).
- **Endpoint:** `POST /api/tenants/[tenant]/push/subscribe` + `POST .../unsubscribe` con Result Pattern + Zod.
- **VAPID:** generar keys (`npx web-push generate-vapid-keys`), guardar en `.env` (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).
- **Cliente:** botón "Activar notificaciones" + `serviceWorkerRegistration.pushManager.subscribe`.
- **Hecho cuando:** suscripción se persiste en DB por tenant; `unsubscribe` limpia.
- **Tests:** UT del push service (subscribe/unsubscribe, Result), E2E del consent.

### TRAMO C — Observabilidad

#### C1. Curar Sentry
- **Archivos:** `apps/web/sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`.
- **Acción:** añadir `tags: { tenant }` (resolver desde URL/headers), `beforeSend` para PII, breadcrumbs de fetch. Confirmar `SENTRY_DSN` en env.
- **Hecho cuando:** un error de prueba en `/t/wondernails` llega a Sentry etiquetado con tenant.

#### C2. Eliminar fuga de credenciales
- **Acción:** `git rm SUPABASE_CREDENTIALS_GUIDE.md` y borrar credenciales hardcoded de `check-services-schema.js` (usar `process.env.DATABASE_URL`).
- **Rotación (dueño):** cambiar password de Supabase en dashboard → actualizar `apps/web/.env.local` y Vercel env.
- **Hecho cuando:** `grep` de la password vieja no aparece en el repo; dueño confirma rotación.

#### C3. Análisis de errores reales (bloqueado por dueño)
- **Acción:** cuando el dueño pegue logs/URLs de Sentry o Vercel → clasificar errores por frecuencia, fijar los top 3.
- **Hecho cuando:** informe de análisis + fixes aplicados (o documentado si requiere otra US).

### TRAMO D — QA (Playwright CLI headed → headless)

#### D1. `testing-usuario.md` por escenario × tenant
- Escenarios: instalar PWA, guardar/editar servicio (con SmartPublish + admin), buscar, push subscribe.
- **Tenants:** wondernails, centro-tenistico, manada-juma.
- #### D2. Playwright `--headed` → fixes → headless con grep `STRY-026`.
- #### D3. UT verdes (`npm run test:unit`).
- #### D4. build/lint/typecheck verdes.

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| `next-pwa` incompatible con Next 16 | SW manual como plan B |
| Rotación de credenciales rompe deploy | Dueño actualiza Vercel + local al mismo tiempo; smoke test post-rotate |
| SW cachea contenido stale | Versionar cache name, `clientsClaim()`, estrategia network-first en rutas dinámicas |
| Push en Vercel serverless | Confirmar tamaño payload (<4KB); usar TTL corto |
| Refactor de routes legacy fuera de alcance | Anotar en `ponytail:` / deuda; otro PR |

---

## Criterio de "hecho" general (antes de visto bueno)

- [ ] Tramos A, B, C1-C2 completos (C3 depende del dueño)
- [ ] build + lint + typecheck + UT + Playwright (headed+headless) en verde, alcance STRY-026
- [ ] `testing-usuario.md` ejecutado 100% en wondernails, centro-tenistico, manada-juma
- [ ] Evidencia de comandos pegada en el aviso al dueño
- [ ] Esperar **visto bueno** explícito → `done` + push/publicar
