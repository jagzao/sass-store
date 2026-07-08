# Test Strategy — STRY-026: PWA instalable por tenant + fix servicios + observabilidad

> Generado por `/test-spec`. Entrada: `docs/stories/active/STRY-026-...md` + `.agents/sprint/STRY-026-pwa-fix-servicios/plan.md`.
> Tipo de funcionalidad: **Fullstack** (UI + API REST + Backend service + Worker push + Infra PWA).

---

## Objetivo de calidad

Cubrir el riesgo de **regresión en guardado/edición de servicios** (causa raíz de datos inconsistentes y "descripción errónea"), garantizar que la **PWA es instalable con identidad por tenant** y que **ningún error de runtime queda sin capturar ni sin aislamiento multitenant**.

## Stack de este proyecto

- **Unit / Integration:** Vitest — `npm run test:unit`, `npm run test:integration`
- **E2E:** Playwright — `npm run test:e2e:subset -- --grep "STRY-026"`
- **Security:** `npm run test:security` (Vitest `tests/security`)
- **Coverage:** `npm run test:coverage`
- **Lint/Typecheck/Build:** `npm run lint && npm run typecheck && npm run build`

## Datos de prueba

- **Tenants:** `wondernails`, `centro-tenistico`, `manada-juma` (repetir escenarios críticos por slug)
- **Usuario:** `jagzao@gmail.com` / `admin`
- **Servicio de prueba:** nombre `Test PWA`, precio `50`, duración `1.5`
- **VAPID:** keys en `.env` (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`)

## Escenarios extraídos (12)

| ID | CA | Scenario |
|----|----|----------|
| SC-01 | CA-1 | Instalación muestra logo y nombre del tenant |
| SC-02 | CA-1 | Manifest se sirve por tenant |
| SC-03 | CA-2 | Páginas vistas funcionan offline |
| SC-04 | CA-2 | Suscripción a push notifications |
| SC-05 | CA-3 | No hay DATABASE_URL apuntando a localhost en producción |
| SC-06 | CA-3 | Fallo fuerte si falta DATABASE_URL |
| SC-07 | CA-4 | Editar servicio muestra la descripción real guardada |
| SC-08 | CA-4 | Guardar servicio nuevo funciona contra la DB correcta |
| SC-09 | CA-5 | Buscar servicio devuelve resultados coherentes |
| SC-10 | CA-5 | Búsqueda con < 3 caracteres no filtra |
| SC-11 | CA-6 | Error de API se captura y reporta |
| SC-12 | CA-6 | Sin credenciales commiteadas |

## Cobertura adicional

| Tipo | Aplica | Objetivo | Riesgo cubierto | Prioridad |
|------|--------|----------|-----------------|-----------|
| Smoke regression | Sí | Manifest link + services list no rompen rutas existentes | Regresión | Alta |
| Multitenant isolation | Sí | Manifest y push subscriptions de tenant A no filtrados a B; services por tenant_id | Seguridad / aislamiento | Alta |
| Result Pattern paths | Sí (push, config) | `Ok`/`Err` retornan tipos correctos; `ConfigurationError` lanzado | Correctness | Media |
| Performance | Parcial | `GET manifest.webmanifest` P95 < 200ms | UX | Baja |
| Negative testing | Sí | push payload inválido, tenant inexistente, DATABASE_URL placeholder | Robustez | Alta |

## Decisión por tipo de test

- **SC-01, SC-03, SC-07, SC-09**: interacción UI → **E2E Playwright** (la "instalación" real se valida con Lighthouse/manifest link, no con gesto nativo).
- **SC-02, SC-04 (parte API), SC-08 (parte API), SC-11**: contrato de endpoint → **Integration Vitest** (ruta handler + DB test o mock).
- **SC-06, SC-10, SC-04 (parte servicio)**: lógica aislada → **Unit Vitest** (connection, filter, pushService).
- **SC-05, SC-12**: configuración/secrets → **Security Vitest** (scan de `.env*` y repo).
- **SC-07/SC-08** también cubren la lógica de las 3 descripciones → **Integration** aparte.

## Checklist de salida para /quality-runner

- [ ] Los 12 SC-XX tienen test asignado en `test-matrix.md`
- [ ] Tests pasan headless sin mocks de red (excepto push/SW que requieren setup SW)
- [ ] Coverage de paths críticos (connection, pushService, services-3desc, manifest) ≥ 80%
- [ ] Smoke regression sin nuevos fallos en `/t/{slug}` y `/api/tenants/{slug}/services`
- [ ] Isolation test: wondernails no ve services/push de vigistudio
- [ ] build / lint / typecheck verdes

## Pendientes / notas

- **SC-12** depende de que el dueño rote la password de Supabase; el test de scan pasa al eliminar el archivo, pero la rotación es acción del dueño.
- **SC-11** ampliable si el dueño comparte logs reales (Tramo C3 del plan) — fuera del alcance de tests automáticos hasta entonces.
- Los routes legacy de `services` (try/catch) se testean en su estado actual; el refactor a Result Pattern queda fuera de alcance (deuda).
