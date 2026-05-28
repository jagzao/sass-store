# Implementaci�n � STRY-017 Rendimiento

## Hallazgos Fase 0 (completada)

1. dynamic = force-dynamic + revalidate = 0 en layout.tsx y page.tsx
2. getTenantBySlug ejecuta 3 veces por request
3. fetchWithCache SSR dispara HTTP interno a 127.0.0.1:3001
4. Pool DB remoto max = 1 serializa queries
5. Quotes, visits, products sin LIMIT default
6. Hooks React Query sin paginaci�n
7. CacheManager sin uso en hot paths, invalidatePattern no-op
8. GSAP eager import en heroes
9. Validaciones booking POST secuenciales

## Detalle por Fase

### Fase 1 ISR

- `layout.tsx`: removed `force-dynamic`, added `export const revalidate = 60` + `generateStaticParams` (200 tenants)
- `page.tsx`: removed `force-dynamic`, added `export const revalidate = 60`

### Fase 2 Memoizacin

- `getTenantBySlug`: replaced `unstable_cache` with dual-cache (Map 60s + `cachedGet` 7200s)
- `_fetchTenantBySlug`: raw DB fetch fallback
- `fetchWithCache`: softened SSR block — `console.warn` for internal `/api/*` + allowlist for `/api/v1/public/*` and `/api/v1/social/*`

### Fase 3 Pool DB

- `connection.ts`: `max: 3`, `idle_timeout: 20`, `max_lifetime: 600` for remote pooler

### Fase 4 API Pagination

- Quotes: default `limit=50`, `offset=0`
- Visits: default `limit=50`, `offset=0`
- Public products: default `limit=24`, `offset=0`
- Public services: default `limit=50`, `offset=0`
- Bookings GET: default `limit=50`, `offset=0`

### Fase 5 UI Pagination

- `useCategories`, `useBudgets`, `useSupplyExpenses` now accept `limit`/`offset`
- `lib/api/categories.ts`, `budgets.ts`, `supply-expenses.ts` updated

### Fase 6 CacheManager

- `invalidatePattern`: implemented via `_keyIndex` Set scan
- `trackKey`/`cachedGet` added for key tracking
- `CACHE_TTL`: TENANT=7200s, PRODUCT=1800s, SERVICE=1800s

### Fase 7 Bundle

- Attempted GSAP dynamic import; reverted due to top-level await in client components
- Documented as future enhancement in `plan.md`

### Fase 8 Paralelismo

- `bookings/route.ts` POST: `Promise.all([service, customer])` instead of sequential `await`

## Validacin

- Lint: 0 errores nuevos
- Typecheck: 0 errores
- Unit tests: 487/487 pasan (35 archivos)
- E2E smoke: 54/69 tests pasan sin regresiones funcionales (302 en admin rutas anónimas es esperado)
- Build: 291s (Next.js 16.1.1, Turbopack)
- Commit: `3bb457f`
