# Story: STRY-018 — Recuperación E2E y CI Gate

> **ID:** STRY-018
> **Estado:** analysis
> **Prioridad:** P0
> **Sprint:** S1
> **Asignado:** QA → Dev → QA
> **Creado:** 2026-05-03
> **Actualizado:** 2026-05-03

**Artefactos de sprint:** `.agents/sprint/STRY-018-e2e-recovery-ci-gate/` con `plan.md`, `implementacion.md`, `testing-usuario.md`.

---

## 1. Narrativa

Como **responsable de calidad de la plataforma**, quiero **que el 90% o más de la suite E2E pase de forma estable y que el CI bloquee deploy en caso de regresión**, para que **cualquier cambio que rompa flujos de usuario real NO llegue a producción**.

### Contexto

- Hoy `npx playwright test` reporta **119 failed, 120 passed, 12 skipped** (de ~239 tests).
- Hay flujos rotos en social, tenants, landing pages y posiblemente autenticación.
- El workflow `.github/workflows/e2e-tests.yml` existe pero desconozco si es **required check** antes del merge/deploy.
- No existe endpoint de health operativo (`/_health`) para validar rápidamente que la app está viva tras deploy.

---

## 2. Criterios de Aceptación (Gherkin)

### CA-1: Inventario de tests rotos y baseline

```gherkin
Dado que el agente ejecuta toda la suite E2E con grep vacio
Cuando compara resultados por tenant/feature
Entonces existe una tabla clasificada por: pasado/fallado/skipped
Y cada fallo tiene categoría: regresión reciente, selector roto, flaky (race condition), preexistente
Y se define un línea base: si un test era preexistentemente roto se documenta con skip justificado
```

### CA-2: Corrección de tests regresión y selector roto

```gherkin
Dado tests clasificados como regresión o selector
Cuando el agente arregla selectors o corrige mocks/seeds
Entonces esos tests pasan en headless sin retry
Y se ejecutan en wondernails y centro-tenistico si aplica multitenancy
```

### CA-3: Flaky tests estabilizados

```gherkin
Dado un test identificado como flaky (fallo intermitente por race condition)
Cuando se añade wait apropiado, se fija seed o se usa retry con expect
Entonces pasa ≥3 ejecuciones consecutivas sin fallo
```

### CA-4: CI gate bloquea deploy en fallos

```gherkin
Dado la suite E2E
Cuando el workflow e2e-tests.yml es marcado como required check en GitHub
Entonces un PR con E2E fallido no puede mergearse a main
Y Vercel deploy preview solo se publica si E2E pasa
```

### CA-5: Health endpoint operativo

```gherkin
Dado la app desplegada
Cuando un monitor externo o CI hace GET /api/health
Entonces responde HTTP 200 con body {"status":"ok","version":"x.y.z","timestamp":"ISO8601"}
Y el check incluye que DB responde en <500ms
```

---

## 3. Mockups / Wireframes

- [x] No aplica (plataforma / infra QA)

---

## 4. Contrato Técnico (API)

### Endpoint

```
GET /api/health
```

### Response

```typescript
interface HealthResponse {
  status: "ok" | "degraded" | "down";
  version: string;
  timestamp: string;
  checks: {
    database: { status: "ok" | "error"; latencyMs: number };
    redis?: { status: "ok" | "error" };
  };
}
```

---

## 5. Impacto Multitenancy

- [ ] Sin impacto en DB
- [ ] **Tenant de prueba E2E:** `wondernails`, `centro-tenistico` (todos los flujos deben pasar en cada slug activo)

---

## 6. Plan de Implementación

Detalle operativo: `.agents/sprint/STRY-018-e2e-recovery-ci-gate/plan.md`.

### Fase 0: Inventario (único paso de PM)

- [ ] Ejecutar suite completa E2E → tabla de resultados por spec
- [ ] Clasificar cada fallo: regresión / selector / flaky / seed / preexistente-ignorar
- [ ] Definir threshold: objetivo <10% failed o 20 tests máx (ajustable tras inventario)

### Fase 1: Fixes rápidos (Dev)

- [ ] Arreglar selectors rotos por cambios de UI
- [ ] Corregir seeds/mocks donde E2E depende de datos que no existen
- [ ] Ajustar timeouts donde haya TTFB alto en login

### Fase 2: Stabilización flaky (Dev→QA bucle)

- [ ] Añadir `waitForFunction` donde haya hidratación
- [ ] Revisar tests con `.first()` que se rompan por duplicados

### Fase 3: CI Gate (DevOps / GitHub)

- [ ] Revisar `.github/workflows/e2e-tests.yml`
- [ ] Marcar E2E como required check en Settings → Branches → main
- [ ] Vincular con Vercel: deploy solo tras E2E verde

### Fase 4: Health endpoint

- [ ] Crear `app/api/health/route.ts`
- [ ] Test unitario para health endpoint

### Fase 5: Playwright CLI headless final

- [ ] `npm run test:e2e` → verificar objetivo <10% failed
- [ ] `testing-usuario.md` actualizado con escenarios ejecutados

---

## 7. Checklist de Calidad

- [ ] E2E suite ≥90% passing (threshold definido tras inventario con justificación si quedan skips)
- [ ] Health endpoint accesible y con test UT
- [ ] CI gate configurado (workflow required; documentado en `.github/README.md` si aplica)
- [ ] `npm run build`, `lint`, `typecheck` sin errores
- [ ] **§ 1.3:** inventario ejecutado, fixes validados, headless final verde
- [ ] **Visto bueno del dueño** antes de `done`

---

## 8. Métricas de Éxito

| Métrica                    | Target                | Actual baseline |
| -------------------------- | --------------------- | --------------- |
| Tests E2E passed           | ≥210 / 239 (≥88%)     | 120 / 239 (50%) |
| Tests failed               | ≤20                   | 119             |
| Tests skipped              | ≤5 o skip justificado | 12              |
| Health endpoint disponible | ✅                    | ❌ (no existe)  |
| CI gate E2E required       | ✅                    | ❌              |

---

## 9. Notas y Riesgos

- **Riesgo:** El inventario puede mostrar que la mayoría de los 119 fallos son preexistentes y dependen de features incompletas (social, whatsapp, etc.). En ese caso, se documenta skip justificado y se enfoca en los que afectan flujos críticos (login, reservas, checkout, POS).
- **Riesgo:** Seeds de DB de test pueden no tener datos consistentes para todos los tenants. El agente debe ajustar seeds antes de re-ejecutar.
- **Dependencia:** STRY-018 puede bloquear o desbloquear STRY-017. Si E2E está muy roto, los fixes de STRY-017 no tienen validación confiable.

---

**Orquestador:** `Implementa STRY-018` → PM → Architect (baseline único) → Dev → QA bucle → **visto bueno** → `done`
