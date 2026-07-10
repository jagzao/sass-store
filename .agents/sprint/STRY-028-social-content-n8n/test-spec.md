# Test Strategy — STRY-028: Generador de Contenido Social con n8n + Ollama

## Objetivo de calidad

Validar que la generación de contenido social funciona de punta a punta: UI del tenant y admin global invocan el workflow n8n correctamente, Ollama genera borradores en la base de datos, el admin puede aprobarlos, y el workflow publicador diario los publica en la red social correspondiente a las 08:00 AM. Cubrir multitenant isolation y regresión en rutas sociales existentes.

## Stack de este proyecto

- Unit/Integration: Vitest (`npm run test:unit`, `npm run test:integration`)
- E2E: Playwright (`npm run test:e2e:subset -- --grep "social"`)
- Security: `npm run test:security`
- Coverage: `npm run test:coverage`

## Tipo de funcionalidad

Fullstack + Integración externa (n8n webhook + Ollama local + DB + plataformas sociales).

## Matriz de trazabilidad

| ID | Scenario | Tipo de test | Archivo destino | Prioridad | Estado |
|----|----------|-------------|-----------------|-----------|--------|
| SC-01 | Admin del tenant genera borradores con Ollama | E2E + Integration | `tests/e2e/social/social-generate-flow.spec.ts`<br>`tests/integration/social/n8n-generate-persistence.spec.ts` | Alta | ⬜ pendiente |
| SC-02 | Super Admin genera contenido desde admin social-planner | E2E + Integration | `tests/e2e/social-planner/admin-generate.spec.ts`<br>`tests/integration/social/admin-generate-tenant-isolation.spec.ts` | Alta | ⬜ pendiente |
| SC-03 | Mix de contenido inválido bloquea generación | E2E + Unit | `tests/e2e/social/social-generate-validation.spec.ts`<br>`tests/unit/social/content-mix-validation.spec.ts` | Media | ⬜ pendiente |
| SC-04 | n8n no disponible muestra error amigable | E2E + Integration | `tests/e2e/social/social-generate-error.spec.ts`<br>`tests/integration/social/n8n-unavailable.spec.ts` | Alta | ⬜ pendiente |
| SC-05 | Admin edita y aprueba un borrador | E2E + Integration | `tests/e2e/social/social-approve-post.spec.ts`<br>`tests/integration/social/approve-to-scheduled.spec.ts` | Alta | ⬜ pendiente |
| SC-06 | Workflow publicador publica a las 08:00 AM | Integration + API | `tests/integration/social/daily-publisher-run.spec.ts`<br>`tests/api/social/publisher-webhook.spec.ts` | Alta | ⬜ pendiente |
| SC-07 | Tenant sin canales habilitados no genera contenido | E2E + Integration | `tests/e2e/social/social-no-channels.spec.ts`<br>`tests/integration/social/no-channels-block.spec.ts` | Media | ⬜ pendiente |
| SC-08 | Ollama responde JSON malformado | Integration | `tests/integration/social/n8n-ollama-parse-error.spec.ts` | Media | ⬜ pendiente |
| SC-09 | Rango de fechas menor a 1 día | E2E + Unit | `tests/e2e/social/social-generate-validation.spec.ts`<br>`tests/unit/social/date-range-validation.spec.ts` | Baja | ⬜ pendiente |
| SC-10 | Frecuencia total cero | E2E + Unit | `tests/e2e/social/social-generate-validation.spec.ts`<br>`tests/unit/social/frequency-validation.spec.ts` | Baja | ⬜ pendiente |
| SC-11 | Publicación fallida marca target como failed | Integration + API | `tests/integration/social/publisher-failure.spec.ts`<br>`tests/api/social/publisher-error-handling.spec.ts` | Alta | ⬜ pendiente |

## Cobertura adicional

| Tipo | Aplica | Objetivo | Riesgo cubierto | Prioridad |
|------|--------|----------|-----------------|-----------|
| Smoke regression | Sí | Verificar que `/t/[tenant]/social`, `/admin/social-planner`, `/api/v1/social/*` no se rompen | Regresión | Alta |
| Multitenant isolation | Sí | wondernails no ve borradores de centro-tenistico y viceversa | Seguridad/Aislamiento | Alta |
| Result Pattern paths | Sí | API route `/api/v1/social/generate` retorna `Ok`/`Err` correctamente | Correctness | Media |
| Performance | No crítico en MVP | P95 generación < 15s (Ollama local) | UX | Baja |
| External dependency health | Sí | Mockear n8n/Ollama caído y responder 503 | Resiliencia | Alta |

## Datos de prueba

- Tenant principal: `wondernails`
- Tenant secundario: `centro-tenistico`
- Tenant sin canales: `manada-juma`
- Usuario: `jagzao@gmail.com` / `admin`
- Plataformas: Facebook + Instagram habilitadas
- Ollama local: `http://127.0.0.1:11434/v1/chat/completions`
- n8n webhook: `http://localhost:5678/webhook/social-generate`

## Notas sobre mocking

- Ollama local no siempre estará corriendo en CI. Para tests unitarios e integración se mockea la respuesta del n8n webhook con JSON válido.
- Tests E2E con Playwright pueden usar `route.fulfill()` para interceptar la llamada de la app al webhook n8n y devolver respuesta simulada.
- El workflow publicador diario se prueba invocando un endpoint interno de test que dispare el mismo SQL/update, sin depender del cron real.

## Checklist de salida para /quality-runner

- [ ] Todos los SC-01..SC-11 tienen test correspondiente
- [ ] Tests pasan en headless sin mocks de red innecesarios
- [ ] Coverage de rutas críticas (`route.ts`, `GenerateView.tsx`, workflow n8n JSON) ≥ 80%
- [ ] Smoke regression de rutas sociales sin nuevos fallos
- [ ] Isolation test: wondernails no ve posts de centro-tenistico
- [ ] Build + lint + typecheck verdes
- [ ] E2E headed y headless verdes para "social-generate"
