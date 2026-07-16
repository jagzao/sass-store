# Test Strategy — STRY-029: Menú de usuario adaptado a la paleta del tenant

## Objetivo de calidad
Validar que el menú desplegable de usuario deriva sus colores de la paleta del tenant activo manteniendo legibilidad en tenants claros, oscuros y sin paleta personalizada, sin regresiones en la navegación del menú.

## Stack de este proyecto
- Unit/Integration: Vitest (`npm run test:unit`, `npm run test:integration`)
- E2E: Playwright (`npm run test:e2e:subset -- --grep "user menu"`)
- Security: `npm run test:security`
- Coverage: `npm run test:coverage`

## Matriz de trazabilidad

| ID | Scenario | Tipo de test | Archivo destino | Prioridad | Estado |
|---|---|---|---|---|---|
| SC-01 | Usuario abre menú en tenant con paleta clara | E2E | `tests/e2e/tenant/user-menu-theme.spec.ts` | Alta | ⬜ pendiente |
| SC-02 | Usuario abre menú en tenant con paleta oscura | E2E | `tests/e2e/tenant/user-menu-theme.spec.ts` | Alta | ⬜ pendiente |
| SC-03 | Tenant sin paleta personalizada | E2E + Unit | `tests/e2e/tenant/user-menu-theme.spec.ts`, `tests/unit/components/UserMenu.spec.tsx` | Media | ⬜ pendiente |
| SC-04 | Estados hover/active mantienen contraste | E2E | `tests/e2e/tenant/user-menu-theme.spec.ts` | Media | ⬜ pendiente |
| SC-05 | Menú responsive conserva paleta del tenant | E2E | `tests/e2e/tenant/user-menu-theme.spec.ts` | Media | ⬜ pendiente |

## Cobertura adicional

| Tipo | Aplica | Objetivo | Riesgo cubierto | Prioridad |
|---|---|---|---|---|
| Smoke regression | Sí | Verificar que el menú aún abre y contiene secciones Cuenta/Gestión/Sistema | Regresión | Alta |
| Multitenant isolation | No aplica | Menú no expone datos cross-tenant | Seguridad | Baja |
| Result Pattern paths | No aplica | Sin lógica de negocio nueva | — | — |
| Performance | No crítico | Render del menú no bloquea | UX | Baja |

## Datos de prueba

- Tenants: `wondernails` (paleta clara), `centro-tenistico` (oscuro/arcilla), `zo-system` (fallback).
- Usuario: `jagzao@gmail.com` / `admin`.
- Verificación E2E: abrir menú, capturar estilos computados de fondo/texto, calcular contraste.

## Checklist de salida para /quality-runner

- [ ] Todos los SC-XX tienen test correspondiente.
- [ ] Tests pasan en headless sin mocks de red.
- [ ] Coverage paths críticos ≥ 80%.
- [ ] Smoke regression sin nuevos fallos.
- [ ] E2E en wondernails y zo-system sin errores visuales.
