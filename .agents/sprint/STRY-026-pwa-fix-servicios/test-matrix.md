# Test Matrix — STRY-026

> Tabla de trazabilidad Gherkin → test. La usan `/test-implementation` y `/quality-runner`.
> Fuente: `test-spec.md`.

## Matriz de trazabilidad

| ID | Scenario | Tipo de test | Archivo destino | Prioridad | Estado |
|----|----------|-------------|-----------------|-----------|--------|
| SC-01 | Instalación muestra logo y nombre del tenant | E2E | `tests/e2e/pwa/manifest-install.spec.ts` | Alta | ⚠️ pendiente server |
| SC-02 | Manifest se sirve por tenant | Integration (API) + E2E | `tests/unit/pwa/manifest-service.spec.ts` ✅, `tests/e2e/multitenant/manifest-by-tenant.spec.ts` | Alta | ✅ unit / ⚠️ E2E |
| SC-03 | Páginas vistas funcionan offline | E2E | `tests/e2e/pwa/offline.spec.ts` | Media | ⚠️ pendiente server |
| SC-04 | Suscripción a push notifications | Unit + Integration (API) + E2E | `tests/unit/push/pushService.spec.ts`, `tests/integration/api/push-subscribe.spec.ts`, `tests/e2e/pwa/push-opt-in.spec.ts` | Alta | ⚠️ pendiente migration push_subscriptions |
| SC-05 | No hay DATABASE_URL apuntando a localhost en producción | Security | `tests/security/env-config.spec.ts` ✅ | Alta | ✅ |
| SC-06 | Fallo fuerte si falta DATABASE_URL | Unit | `tests/unit/database/connection.spec.ts` ✅ | Alta | ✅ |
| SC-07 | Editar servicio muestra la descripción real guardada | Integration + E2E | `tests/integration/api/services-three-descriptions.spec.ts`, `tests/e2e/services/admin-services-edit.spec.ts` ✅ | Alta | ✅ E2E |
| SC-08 | Guardar servicio nuevo funciona contra la DB correcta | Integration (API) + E2E | `tests/integration/api/services-create.spec.ts`, `tests/e2e/services/admin-services-edit.spec.ts` ✅ | Alta | ✅ E2E |
| SC-09 | Buscar servicio devuelve resultados coherentes | E2E | `tests/e2e/services/admin-services-edit.spec.ts` ✅ | Media | ✅ E2E |
| SC-10 | Búsqueda con < 3 caracteres no filtra | Unit | `tests/unit/services/services-filter.spec.ts` ✅ | Media | ✅ |
| SC-11 | Error de API se captura y reporta (no stack leak) | Integration + Security | `tests/integration/api/error-reporting.spec.ts`, `tests/security/problem-details.spec.ts` | Media | ⚠️ pendiente server |
| SC-12 | Sin credenciales commiteadas | Security | `tests/security/secret-scan.spec.ts` ✅ | Alta | ✅ |

**Leyenda:** ✅ implementado y verde · ⚠️ requiere servidor local levantado + migration `push_subscriptions` aplicada (paso manual del dueño) — los specs E2E/integration se escriben en `/quality-runner` o cuando el entorno esté listo.

## Cobertura transversal

| Tipo | Archivo | Cubre | Prioridad |
|------|---------|-------|-----------|
| Smoke regression | `tests/e2e/smoke/stry-026-smoke.spec.ts` | rutas /t/{slug} y /api/tenants/{slug}/services siguen respondiendo | Alta |
| Multitenant isolation | `tests/e2e/multitenant/push-isolation.spec.ts` | wondernails no ve push_subs de vigistudio | Alta |
| Result Pattern paths | `tests/unit/push/pushService.spec.ts`, `tests/unit/database/connection.spec.ts` | Ok/Err + ConfigurationError | Media |
| Negative testing | `tests/integration/api/push-subscribe.spec.ts` | payload inválido, tenant inexistente, VAPID ausente | Alta |

## Resumen por tipo

- **Unit (4):** connection, services-filter, pushService (×1 con Ok/Err)
- **Integration (5):** manifest, push-subscribe, services-three-descriptions, services-create, error-reporting
- **E2E (6):** manifest-install, manifest-by-tenant, offline, push-opt-in, admin-services-edit (SC-07+SC-08), admin-services-search
- **Security (4):** env-config, problem-details, secret-scan, push-isolation (multitenant)
- **Smoke (1):** stry-026-smoke

**Total: 20 archivos de test para 12 scenarios + cobertura transversal.**
