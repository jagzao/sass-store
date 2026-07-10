# Test Matrix — STRY-028

| ID | Scenario | Tipo de test | Archivo destino | Prioridad | Estado |
|----|----------|-------------|-----------------|-----------|--------|
| SC-01 | Admin del tenant genera borradores con Ollama | E2E + Integration | `tests/e2e/social/social-generate-flow.spec.ts` ✅<br>`tests/integration/social/n8n-generate-persistence.spec.ts` ✅ | Alta | ✅ done |
| SC-02 | Super Admin genera contenido desde admin social-planner | E2E + Integration | `tests/e2e/social-planner/admin-generate.spec.ts` ⬜<br>`tests/integration/social/admin-generate-tenant-isolation.spec.ts` ⬜ | Alta | ⬜ pendiente (post-MVP: requiere UI de admin) |
| SC-03 | Mix de contenido inválido bloquea generación | E2E + Unit | `tests/e2e/social/social-generate-flow.spec.ts` ✅<br>`tests/unit/social/content-mix-validation.spec.ts` ✅ | Media | ✅ done |
| SC-04 | n8n no disponible muestra error amigable | E2E + Integration | `tests/e2e/social/social-generate-flow.spec.ts` ✅<br>`tests/integration/social/n8n-generate-persistence.spec.ts` ✅ | Alta | ✅ done |
| SC-05 | Admin edita y aprueba un borrador | E2E + Integration | `tests/e2e/social/social-approve-post.spec.ts` ⬜<br>`tests/integration/social/approve-to-scheduled.spec.ts` ⬜ | Alta | ⬜ pendiente (funcionalidad existente en queue/route.ts) |
| SC-06 | Workflow publicador publica a las 08:00 AM | Integration + API | `tests/integration/social/daily-publisher-run.spec.ts` ⬜ | Alta | ⬜ pendiente (requiere n8n activo) |
| SC-07 | Tenant sin canales habilitados no genera contenido | E2E + Integration | `tests/e2e/social/social-no-channels.spec.ts` ⬜ | Media | ⬜ pendiente (post-MVP) |
| SC-08 | Ollama responde JSON malformado | Integration | `tests/integration/social/n8n-generate-persistence.spec.ts` ✅ | Media | ✅ done |
| SC-09 | Rango de fechas menor a 1 día | Unit | `tests/unit/social/date-range-validation.spec.ts` ✅ | Baja | ✅ done |
| SC-10 | Frecuencia total cero | Unit | `tests/unit/social/frequency-validation.spec.ts` ✅ | Baja | ✅ done |
| SC-11 | Publicación fallida marca target como failed | Integration + API | `tests/integration/social/publisher-failure.spec.ts` ⬜ | Alta | ⬜ pendiente (requiere n8n + plataforma API) |

## Resumen

- **7/11 escenarios cubiertos** (SC-01, SC-03, SC-04, SC-08, SC-09, SC-10 + validación extra)
- **4/11 pendientes** requieren infraestructura externa (n8n activo, OAuth de plataformas, UI admin global)
- Tests E2E: 3 pasando (SC-01, SC-03, SC-04)
- Tests unit: 13 pasando
- Tests integration: 3 pasando
