---
name: test-spec
description: Define a testing and quality strategy from a functional specification, mapping each Gherkin scenario to a test type and file. Use when the user says "/test-spec", "crear estrategia de pruebas", or automatically after spec is approved.
metadata:
  version: "2.0"
  language: es
---

# Skill: Definir Estrategia de Pruebas y Calidad

## FASE 1 — Validar entrada

Leer `.agents/sprint/{STRY-XXX}/plan.md`. Debe contener:
- Descripción general, actores, flujos
- Reglas de negocio
- **Scenarios Gherkin** (criterios de aceptación) — si faltan, pedir que se ejecute `/spec` primero

Extraer todos los `Scenario:` y `Scenario Outline:` del plan.md. Numerarlos (SC-01, SC-02...).

## FASE 2 — Detectar tipo de funcionalidad

Web/UI | API REST | Backend service | Fullstack | Worker/Job | Integración externa

## FASE 3 — Matriz de trazabilidad Gherkin → Tests

Para cada Scenario extraído, asignar:

| ID | Scenario | Tipo de test | Archivo destino | Prioridad | Estado |
|----|----------|-------------|-----------------|-----------|--------|
| SC-01 | [título del scenario] | E2E/Unit/Integration/API | `tests/[tipo]/[feature]/[nombre].spec.ts` | Alta/Media/Baja | ⬜ pendiente |
| SC-02 | ... | ... | ... | ... | ⬜ pendiente |

Reglas de asignación:
- Scenario con interacción UI visible → **E2E** (Playwright)
- Scenario que valida lógica de negocio aislada → **Unit** (Vitest)
- Scenario que involucra DB + servicio → **Integration** (Vitest)
- Scenario que valida contrato de API (status, payload, errores) → **API** (Vitest + supertest o curl)
- Scenario de seguridad o tenant isolation → **Security** (Vitest)
- Un Scenario puede tener dos tipos si cubre tanto UI como API

## FASE 4 — Cobertura adicional

| Tipo | Aplica | Objetivo | Riesgo cubierto | Prioridad |
|------|--------|----------|-----------------|-----------|
| Smoke regression | Siempre | Verificar que el feature no rompe rutas existentes | Regresión | Alta |
| Multitenant isolation | Si toca datos | Un tenant no ve datos de otro | Seguridad/Aislamiento | Alta |
| Result Pattern paths | Si hay lógica nueva | Ok y Err retornan los tipos correctos | Correctness | Media |
| Performance | Si es crítico | P95 < 2s en operaciones clave | UX | Baja |

## FASE 5 — Estrategia completa

Generar documento con:

```markdown
# Test Strategy — {STRY-XXX}: {nombre feature}

## Objetivo de calidad
[1-2 líneas: qué riesgo cubre esta estrategia]

## Stack de este proyecto
- Unit/Integration: Vitest (`npm run test:unit`, `npm run test:integration`)
- E2E: Playwright (`npm run test:e2e:subset -- --grep "nombre"`)
- Security: `npm run test:security`
- Coverage: `npm run test:coverage`

## Matriz de trazabilidad
[tabla de FASE 3 completa]

## Datos de prueba
- Tenant: wondernails | zo-system
- Usuario: jagzao@gmail.com / admin
- [datos específicos del feature]

## Checklist de salida para /quality-runner
- [ ] Todos los SC-XX tienen test correspondiente
- [ ] Tests pasan en headless sin mocks de red
- [ ] Coverage paths críticos ≥ 80%
- [ ] Smoke regression sin nuevos fallos
- [ ] Isolation test: tenant A no ve datos de tenant B
```

## FASE 6 — Guardar y auto-continuar

Guardar en:
- `.agents/sprint/{STRY-XXX}/test-spec.md` — documento completo
- `.agents/sprint/{STRY-XXX}/test-matrix.md` — solo la tabla de trazabilidad (la usa `/test-implementation` y `/quality-runner`)

Actualizar `.agents/memory/workflow-state.json`:
```json
{
  "testSpecStatus": "done",
  "currentStage": "implementation",
  "lastAgent": "test-spec"
}
```

**Continuar automáticamente con Skill: implement** — no esperar al usuario.

## Notas
- No escribir código todavía — solo la estrategia.
- Cada Scenario de la spec DEBE tener al menos un test asignado. Si alguno queda sin cubrir, justificar explícitamente.
- Para multitenant: repetir escenarios críticos por cada slug activo.
