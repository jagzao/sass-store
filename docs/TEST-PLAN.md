# Test Plan — Sass Store

## Objetivo

Garantizar >=80% cobertura de lógica, flujos E2E estables y seguridad per-tenant.

## Niveles de Prueba

### 1. Unit Tests (`tests/unit/**/*.spec.ts`)

- Utilidades, servicios, helpers, validaciones Zod.
- Patrón: `expectSuccess(result)` / `expectFailure(result)` para Result Pattern.
- Framework: Vitest.

### 2. Integration Tests (`tests/integration/**/*.spec.ts`)

- Rutas API con mocks de DB o Docker Postgres temporal.
- Seguridad RLS (13 tests específicos).
- Framework: Vitest.

### 3. E2E Tests (`tests/e2e/**/*.spec.ts`)

- Playwright en chromium, firefox, webkit.
- Flujos: compra, reserva, reorder, auth, social planner.
- Mobile: emulación Mobile Chrome / Mobile Safari.

### 4. Smoke Tests

- `npm run test:smoke` — health endpoints, assets críticos, pings multitenant.

## Presupuestos de UX

- Compra desde Home/PLP: ≤3 clics.
- Reserva desde PLP: ≤2 clics.
- Admin — guardar cambios: ≤2 clics.

## Entornos

- Local: `npm run dev` (3001)
- Staging: Vercel preview
- Producción: Vercel production

## Cómo ejecutar

```bash
npm run test:unit
npm run test:integration
npm run test:e2e:all
npm run test:e2e:subset -- --grep "booking"
npm run test:smoke
npm run test:coverage
```

## Escenarios Negativos Obligatorios

- Credenciales inválidas
- Sesión expirada
- Cross-tenant (IDs de otro tenant)
- Payloads inválidos / límites Zod
- 404 / NotFound
- Permisos insuficientes

---

_Fuente de verdad detallada: `docs/TESTING_MASTER_PLAN.md` y `docs/E2E_TESTING_GUIDE.md`. Actualizado: 2026-05-31._
