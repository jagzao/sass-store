# Test Strategy — STRY-033: Ícono de feedback junto al logo del tenant

## Objetivo de calidad

Verificar que el nuevo ícono de feedback en `TenantHeader` es visible y funcional en todas las variantes de header (default/transparent/dark), en mobile y para todos los tenants, sin romper el botón flotante de feedback ya existente ni el layout del header.

## Stack de este proyecto

- Unit/Integration: Vitest (`npm run test:unit`, `npm run test:integration`)
- E2E: Playwright (`npm run test:e2e:subset -- --grep "feedback-icon-header"`)
- Security: `npm run test:security`
- Coverage: `npm run test:coverage`

## Matriz de trazabilidad

| ID | Scenario | Tipo de test | Archivo destino | Prioridad | Estado |
|----|----------|-------------|-----------------|-----------|--------|
| SC-01 | Ícono visible junto al logo en header default | E2E | `tests/e2e/feedback/feedback-icon-header.spec.ts` | Alta | ⬜ pendiente |
| SC-02 | Ícono visible en header transparente sin scroll | E2E | `tests/e2e/feedback/feedback-icon-header.spec.ts` | Media | ⬜ pendiente |
| SC-03 | Ícono visible en header oscuro | E2E | `tests/e2e/feedback/feedback-icon-header.spec.ts` | Media | ⬜ pendiente |
| SC-04 | Click en el ícono abre el panel de feedback (categoría Opinión) | E2E | `tests/e2e/feedback/feedback-icon-header.spec.ts` | Alta | ⬜ pendiente |
| SC-05 | Botón flotante sigue disponible en paralelo | E2E (regresión, reutiliza test existente) | `tests/e2e/feedback/send-opinion.spec.ts` (ya existe) | Media | ⬜ pendiente (solo re-ejecutar) |
| SC-06 | Ícono visible en mobile sin colapsar a menú | E2E | `tests/e2e/feedback/feedback-icon-header.spec.ts` | Media | ⬜ pendiente |
| SC-07 | Feature aplica a todos los tenants (wondernails, zo-system, centro-tenistico) | E2E (parametrizado) | `tests/e2e/feedback/feedback-icon-header.spec.ts` | Alta | ⬜ pendiente |

## Datos de prueba

- Tenants: `wondernails` (variant default/transparent), `zo-system` (variant transparent/dark según landing), `centro-tenistico` (variant transparent especial)
- Usuario: sin sesión (flujo público, visitante anónimo) — cubre el caso donde el campo email es visible
- Viewport mobile: 375x667 (iPhone SE) para SC-06
- No requiere usuario admin ni datos seed adicionales — es un cambio puramente de UI de header

## Checklist de salida para /quality-runner

- [ ] Todos los SC-01..SC-07 tienen test correspondiente
- [ ] Tests pasan en headless sin mocks de red
- [ ] Smoke regression: `send-opinion.spec.ts` y `send-problem.spec.ts` siguen pasando (botón flotante intacto)
- [ ] Isolation test: no aplica (no hay datos por tenant involucrados, solo UI del header) — justificado explícitamente, se omite
- [ ] Verificación visual manual (Playwright CLI headed) en al menos 1 tenant con cada variante de header (default/transparent/dark)
