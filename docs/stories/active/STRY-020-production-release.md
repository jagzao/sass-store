# Story: STRY-020 — Go-Live Hardening y salida a Producción

> **ID:** STRY-020
> **Estado:** active
> **Prioridad:** P0
> **Sprint:** S2
> **Asignado:** PM → Architect → Dev → QA → DevOps
> **Creado:** 2026-05-05
> **Actualizado:** 2026-05-13
> **Depende de:** STRY-018 (E2E/CI gate), STRY-019 (secrets/observabilidad), STRY-017 (plataforma perf+sec)

**Artefactos de sprint:** `.agents/sprint/STRY-020-production-release/` con `plan.md`, `implementacion.md`, `testing-usuario.md`.

---

## 1. Narrativa

Como **responsable de la plataforma**, quiero **cerrar un hardening integral de release (build reproducible, quality gates reales, E2E estable y smoke multitenant post-deploy)** para que **Sass Store llegue a producción sin regresiones críticas ni bloqueos operativos**.

### Contexto

- El workspace muestra una base de cambios grande y heterogénea; se requiere aislar release scope antes de merge.
- `npm run build` falla en entorno local por descarga de Google Fonts (`Inter`, `Montserrat`, `Rajdhani`) con error TLS.
- `npm run test:e2e:subset` no funciona por script no compatible (`ts-node ./tests/e2e/subset/*.e2e.ts`), impidiendo subset confiable.
- `npm run lint` pasa con warnings; `npm run test:unit` está verde (445+ tests) y sirve como base de confianza.
- Deploy target: Vercel. Se exige smoke post-deploy por tenant y plan de rollback.

---

## 2. Criterios de Aceptación (Gherkin)

### CA-1: Build reproducible y desbloqueado para release

```gherkin
Dado que el build actual falla por fetch de Google Fonts con TLS
Cuando se configura una estrategia reproducible de fuentes para build (TLS de sistema Turbopack o self-hosted/local fallback)
Entonces npm run build finaliza exitosamente en local/CI
Y la solución queda documentada en esta story y su plan operativo
```

### CA-2: Subset E2E ejecutable y confiable

```gherkin
Dado que el comando npm run test:e2e:subset falla por script roto
Cuando se migra/ajusta el script para ejecutar Playwright subset real con --grep
Entonces npm run test:e2e:subset -- --grep "<story|feature>" corre sin errores de módulo
Y se usa como gate rápido de regresión antes del suite completo
```

### CA-3: Quality gate de producción completamente verde

```gherkin
Dado que build y subset E2E ya están desbloqueados
Cuando se ejecuta lint + typecheck estricto + build + UT + E2E headed + E2E headless
Entonces no hay bloqueadores (errores) en ningún paso
Y se adjunta evidencia de comandos/resultados para reviewer
```

### CA-4: Release scope limpio y trazable

```gherkin
Dado que el repo tiene un volumen grande de cambios no orientados a release
Cuando se crea/cierra una rama de estabilización con solo cambios aprobados de salida
Entonces el diff de release queda acotado, auditado y sin artefactos temporales
Y git status queda limpio antes de merge/deploy
```

### CA-5: Deploy a Vercel con smoke multitenant + rollback probado

````gherkin
Dado master actualizado y CI verde
Cuando se despliega a Vercel y se ejecuta smoke sobre tenants definidos
Entonces /api/health responde 200
Y wondernails + centro-tenistico (mínimo) cargan y permiten login admin
Y existe procedimiento de rollback validado/documentado si smoke falla

### CA-6: Seguridad y observabilidad mínimas de salida

```gherkin
Dado el release candidate listo para deploy
Cuando se validan variables críticas, headers y errores sanitizados
Entonces no hay secretos expuestos en código/logs
Y existe trazabilidad de errores en observabilidad para incidentes post-release
````

```

---

## 3. Mockups / Wireframes

- [x] No aplica (DevOps / release process)

---

## 4. Contrato Técnico

### Checklist técnico mínimo del release candidate

- Build reproducible en local/CI (sin dependencia frágil de TLS externo)
- Script `test:e2e:subset` funcional con `--grep`
- Typecheck estricto real ejecutable (`npx tsc --noEmit --incremental false`)
- Playwright headed + headless en verde para alcance de story
- Ramas/diff de release acotadas a cambios aprobados
- Smoke multitenant en producción + evidencia + rollback plan

### DomainError / riesgos operativos a cubrir

- `InfrastructureError` — fallo de TLS/fetch de assets en build
- `ValidationError` — comando o configuración inválida de pipeline
- `AuthorizationError` — secretos/permisos de deploy insuficientes
- `NotFoundError` — rutas/tenant no disponibles en smoke post-deploy

---

## 5. Impacto Multitenancy

- [ ] Sin cambios de schema DB en esta US de hardening
- [ ] Validar post-deploy en: `wondernails`, `centro-tenistico`, root fallback
- [ ] Verificar no hay fugas cross-tenant en login/landing básica

---

## 6. Plan de Implementación

Detalle operativo: `.agents/sprint/STRY-020-production-release/plan.md`.

### Fase 0: Pre-requisitos y alcance

- [ ] Confirmar qué entregables de STRY-017/018/019 entran al release candidate
- [ ] Definir rama de estabilización y freeze de cambios no relacionados
- [ ] Alinear owner de deploy y ventana de publicación

### Fase 1: Remediación de bloqueos de salida

- [ ] Solucionar build TLS/fonts para local y CI
- [ ] Reparar script `test:e2e:subset`
- [ ] Validar typecheck estricto fuera de shortcuts

### Fase 2: Quality Gate release

- [ ] `npm run lint` → 0 errors (warnings documentados)
- [ ] `npx tsc --noEmit --incremental false` → 0 errors
- [ ] `npm run build` → sin ignoreBuildErrors
- [ ] `npm run test:unit` → ≥445 passed
- [ ] `npm run test:e2e:subset -- --headed --grep "STRY-020|release|smoke"`
- [ ] `npm run test:e2e:subset -- --grep "STRY-020|release|smoke"`
- [ ] `npx playwright test` → suite de regresión acordada

### Fase 3: Release branch, review y merge

- [ ] Abrir PR de release candidate con diff acotado
- [ ] Reviewer técnico (`pr-reviewer`) en verde
- [ ] Merge a `master` con CI gate passing

### Fase 4: Deploy y post-smoke multitenant

- [ ] Deploy a Vercel (`main/master` o `vercel --prod`)
- [ ] Esperar build Ready sin errores de runtime inicial
- [ ] Smoke por tenant + health + login admin
- [ ] Validar observabilidad/alertas base y checklist de rollback

---

## 7. Checklist de Calidad

- [ ] Build reproducible (sin bloqueo TLS/fonts)
- [ ] `test:e2e:subset` funcional y ejecutado
- [ ] Pipeline completo verde (lint + tsc + build + UT + E2E headed/headless)
- [ ] Scope de release acotado y trazable en PR
- [ ] Vercel build exitoso + smoke multitenant OK
- [ ] Rollback documentado y probado a nivel procedimiento
- [ ] **Visto bueno del dueño** antes de `done`

---

## 8. Métricas de Éxito

| Métrica                              | Target                  | Baseline |
| ------------------------------------ | ----------------------- | -------- |
| Build release (`npm run build`)      | 100% éxito              | Bloqueado por TLS fonts |
| Subset E2E (`test:e2e:subset`)       | 100% ejecutable         | Script roto |
| Unit tests                            | 100% pass (sin errores) | Verde (445+ pass) |
| Smoke producción (health + 2 tenants)| 100% pass               | Pendiente |
| Incidentes P0/P1 en primeras 24h     | 0                       | Pendiente |

---

## 9. Notas y Riesgos

- **Riesgo alto:** Build no reproducible por dependencia de Google Fonts vía TLS en entorno restringido.
- **Riesgo alto:** script de subset E2E roto impide validación incremental rápida.
- **Riesgo alto:** working tree masivo aumenta probabilidad de regresión si no se congela scope.
- **Riesgo medio:** warnings de hooks pueden causar bugs de estado en runtime.
- **Dependencia:** esta US consolida y puede incluir remediaciones de STRY-017/018/019, pero no debe marcar `done` sin evidencia de sus gates.

---

**Orquestador:** `Implementa STRY-020` → PM (scope/freeze) → Architect (risk/design) → Dev (fix bloqueos) → QA (headed+headless+smoke) → DevOps (deploy/rollback) → **visto bueno** → `done`
```
