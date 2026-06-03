# Story: STRY-022 — Quality OS Compliance & Dashboard Interno

> **ID:** STRY-022  
> **Estado:** active  
> **Prioridad:** P0  
> **Sprint:** S2  
> **Asignado:** Dev → QA  
> **Creado:** 2026-05-31  
> **Actualizado:** 2026-05-31  
> **Trigger:** Análisis de `C:\Dev\Zo\sass-store\.agent-reports` — este directorio es el **indicador de calidad** del proyecto. Cada vez que el dueño solicite análisis de esa carpeta, el agente debe actualizar esta US y su plan antes de entregar.

**Artefactos de sprint:** `.agents/sprint/STRY-022-quality-os/` con `plan.md`, `implementacion.md`, `testing-usuario.md`.

---

## 1. Narrativa

Como **responsable de plataforma**, quiero **cerrar todas las brechas detectadas por Quality OS (excepto P0 secrets, que se maneja por STRY-019) y disponer de un dashboard interno que refleje el score de calidad en tiempo real**, para que **el proyecto cumpla con estándares documentales, contrato de agentes y tenga visibilidad operativa del estado de calidad**.

### Contexto

- `quality-report.json` reporta **Quality Score: 0/100**, documentación al **17%**, contrato de agentes al **0%**.
- Hallazgos accionables: 10 documentos faltantes; no hay agent guard rules; falta `quality.config.json`; archivos `.env` requieren revisión.
- Se excluye explícitamente el hallazgo **P0 Possible secrets** — se gestiona en **STRY-019**.
- El dueño ha establecido la regla: _cada vez que se analice `.agent-reports`, esta US se actualiza_.

---

## 2. Criterios de Aceptación (Gherkin)

### CA-1: Documentación obligatoria presente

```gherkin
Dado que Quality OS reporta 10 documentos faltantes
Cuando el agente crea cada documento con contenido real y basado en el estado del repo
Entonces la carpeta docs/ contiene: ROADMAP.md, USER-STORIES.md, ACCEPTANCE-CRITERIA.md, API-SPEC.md, DATABASE.md, TEST-PLAN.md, SECURITY.md, DEPLOYMENT.md, QUALITY-REPORT.md y CHANGELOG.md
Y cada documento referencia a sus fuentes canónicas (BACKLOG.md, package.json, schema.ts, etc.)
```

### CA-2: Agent Guard Rules y quality.config.json

```gherkin
Dado que Quality OS reporta "No agent rules found" y falta quality.config.json
Cuando se crean las guard rules bajo .agents/guards/*.md y el archivo quality.config.json
Entonces el score de "Agents Contract" sube de 0%
Y quality.config.json mapea endpoints, rutas y reglas del proyecto
```

### CA-3: Dashboard interno de calidad operativo

```gherkin
Dado que no existe una pantalla de Quality OS en la app
Cuando se implementa /admin/quality con un dashboard que lee quality-report.json
Entonces un usuario Admin puede ver:
  - Quality Score actual
  - Lista de hallazgos por severidad
  - Estado de documentación, tests, endpoints y CI
  - Última fecha de escaneo
```

### CA-4: Tests E2E y smoke

```gherkin
Dado que existe /admin/quality
Cuando un admin autenticado navega al dashboard
Entonces se muestra la información de calidad sin errores de consola
Y los tests E2E pasan (happy path, navegación, accesibilidad mínima)
Y los tests headless de subset --grep "quality" pasan limpios
```

---

## 3. Mockups / Wireframes

- No aplica — dashboard data-driven simple, inspirado en cards de métricas existentes en /admin.

---

## 4. Contrato Técnico (API)

### Endpoint

```
GET /api/system/quality
```

### Response

```typescript
type QualityResponse = {
  score: number;
  documentation: number;
  agentsContract: number;
  testFiles: number;
  frontendRoutes: number;
  backendEndpoints: number;
  ciPipeline: boolean;
  lastScan: string;
  findings: Array<{
    severity: "P0" | "P1" | "P2";
    message: string;
    category: string;
  }>;
};
```

### DomainError Variants

- `FileSystemError` — no se pudo leer quality-report.json
- `ParseError` — JSON inválido

---

## 5. Impacto Multitenancy

- [ ] Sin impacto en DB (no requiere tablas)
- [ ] UI accesible solo a `admin@zo-system.com` (control en cliente + API opt-in)
- [ ] Sin RLS adicional

---

## 6. Plan de Implementación

### Fase 1: Documentos de calidad

- [ ] `docs/ROADMAP.md`
- [ ] `docs/USER-STORIES.md`
- [ ] `docs/ACCEPTANCE-CRITERIA.md`
- [ ] `docs/API-SPEC.md`
- [ ] `docs/DATABASE.md`
- [ ] `docs/TEST-PLAN.md`
- [ ] `docs/SECURITY.md`
- [ ] `docs/DEPLOYMENT.md`
- [ ] `docs/QUALITY-REPORT.md`
- [ ] `docs/CHANGELOG.md`

### Fase 2: Agent Guards + quality.config.json

- [ ] `.agents/guards/quality-os-rules.md`
- [ ] `.agents/guards/common-guards.md`
- [ ] `quality.config.json`

### Fase 3: Dashboard API + UI

- [ ] `apps/web/app/api/system/quality/route.ts` — lee quality-report.json
- [ ] `apps/web/app/admin/quality/page.tsx` — dashboard con cards
- [ ] `apps/web/app/admin/quality/QualityDashboardClient.tsx` — cliente interactivo

### Fase 4: UAT + E2E

- [ ] `tests/e2e/quality-dashboard.spec.ts`
- [ ] `tests/e2e/smoke-quality.spec.ts`
- [ ] `testing-usuario.md` con pasos por escenario

---

## 7. Checklist de Calidad

- [ ] Documentos realistas basados en fuentes del repo
- [ ] `build` sin errores
- [ ] `lint` sin errores
- [ ] `typecheck` sin errores
- [ ] `npm run test:unit` ≥ verde
- [ ] `npm run test:e2e:subset -- --grep "quality"` verde (headless)
- [ ] Sin errores de consola en UI
- [ ] AGENTS.md actualizado con regla de `.agent-reports`

---

## 8. Métricas de Éxito

| Métrica                   | Target | Actual |
| ------------------------- | ------ | ------ |
| Documentos Quality OS     | 10/10  | —      |
| Agent Guard Rules         | ≥2     | —      |
| Quality Score (post-impl) | ≥60    | —      |
| Tests E2E quality         | ≥4     | —      |

---

## 9. Notas y Riesgos

- **Riesgo:** quality-report.json puede estar desfasado; el dashboard debe cachear 60s y mostrar la fecha del scan.
- **Riesgo:** `.env.cloudflare` está trackeado pero no contiene secrets; se documenta su naturaleza inocua.
- **Dependencia:** No bloquea ni es bloqueada por STRY-019 (exclusión explícita de secrets).

---

**Orquestador:** Ejecutar `.agents/sprint/STRY-022-quality-os/plan.md` → Dev → QA (Playwright CLI headed+headless) → visto bueno del dueño → `done`.
