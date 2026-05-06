# Story: STRY-020 — Release gate y deploy a producción

> **ID:** STRY-020
> **Estado:** analysis
> **Prioridad:** P0
> **Sprint:** S2
> **Asignado:** Dev → QA → DevOps
> **Creado:** 2026-05-05
> **Depende de:** STRY-018 ✅ (E2E ≥88%), STRY-019 ✅ (build strict + secrets), STRY-017 ✅ (sec audit)

**Artefactos de sprint:** `.agents/sprint/STRY-020-production-release/` con `plan.md`, `implementacion.md`, `testing-usuario.md`.

---

## 1. Narrativa

Como **responsable de la plataforma**, quiero **ejecutar el proceso de release completo — limpiar el working tree, mergear a master, pasar el quality gate final y hacer deploy a Vercel** para que **la aplicación quede disponible en producción con todos los cambios de las historias S1–S2 validados**.

### Contexto

- Rama activa: `auto/1745887834-feat-pos-booking-retouch-cart-inventory` (3 commits adelante de `master`).
- Hay 7 archivos con cambios no commiteados (modified/staged) y 4 archivos `tmp-*.js` sin trackear en la raíz.
- STRY-018/019/017 deben estar cerrados con visto bueno **antes** de ejecutar esta US.
- El deploy target es Vercel (configurado en `vercel.json`). `npm run build` ya pasa.
- No existe proceso documentado de release; esta US lo establece.

---

## 2. Criterios de Aceptación (Gherkin)

### CA-1: Working tree limpio

```gherkin
Dado que la rama tiene cambios no commiteados y archivos tmp sueltos
Cuando el agente stagea y commitea los cambios relevantes
Y elimina tmp-get-categories.js, tmp-health.js, tmp-list-tenants.js, tmp-test-categories-api.js
Entonces git status reporta: working tree clean
Y ningún archivo tmp-*.js existe en la raíz del repo
```

### CA-2: Quality gate final verde

```gherkin
Dado que la rama está limpia
Cuando el agente corre el pipeline completo de validación
Entonces npm run lint pasa (0 errors, warnings aceptados)
Y tsc --noEmit pasa con 0 errors
Y npm run build pasa sin ignoreBuildErrors
Y npm run test:unit pasa ≥445/446
Y npx playwright test pasa ≥88% (≤20 failed)
```

### CA-3: Merge a master

```gherkin
Dado que quality gate pasó completo
Cuando el agente hace merge de la rama a master (fast-forward o merge commit)
Entonces master contiene todos los commits de la feature branch
Y la rama feature puede ser eliminada opcionalmente
```

### CA-4: Deploy a Vercel

```gherkin
Dado master actualizado
Cuando se hace push a master (o deploy manual con vercel --prod)
Entonces Vercel build pasa sin errores
Y la app responde en la URL de producción con HTTP 200
Y GET /api/health responde {"status":"ok"}
Y login con jagzao@gmail.com/admin funciona en al menos un tenant activo
```

### CA-5: Post-deploy smoke test

```gherkin
Dado el deploy exitoso
Cuando el agente ejecuta smoke E2E contra la URL de producción
Entonces /t/wondernails/login responde y permite autenticación
Y /t/wondernails/pos carga sin error 500
Y /t/centro-tenistico/ (landing) carga
Y /api/health retorna 200 JSON
```

---

## 3. Mockups / Wireframes

- [x] No aplica (DevOps / release process)

---

## 4. Contrato Técnico

### Checklist de archivos a commitear

```
.github/workflows/e2e-tests.yml        (staged — CI gate)
apps/web/app/api/debug/seed-e2e/route.ts  (staged — seed mejorado)
apps/web/app/api/finance/seed/route.ts    (nuevo — finance seed)
tests/e2e/helpers/test-helpers.ts         (staged — fixes selectores)
tests/e2e/finance/complete.spec.ts        (unstaged — finance E2E)
.agents/sprint/STRY-018-e2e-recovery-ci-gate/implementacion.md
.agents/sprint/STRY-001-pos-robusto-e2e/testing-usuario.md
apps/web/app/t/[tenant]/finance/budgets/page.tsx  (unstaged)
```

### Archivos a eliminar

```
tmp-get-categories.js
tmp-health.js
tmp-list-tenants.js
tmp-test-categories-api.js
```

---

## 5. Impacto Multitenancy

- [ ] Sin cambios de schema DB
- [ ] Validar post-deploy en: `wondernails`, `centro-tenistico`
- [ ] Validar que `zo-system` (fallback) responde sin error 500

---

## 6. Plan de Implementación

Detalle operativo: `.agents/sprint/STRY-020-production-release/plan.md`.

### Fase 0: Pre-requisitos (verificar antes de empezar)

- [ ] STRY-018 cerrado con visto bueno dueño
- [ ] STRY-019 cerrado con visto bueno dueño
- [ ] STRY-017 cerrado con visto bueno dueño

### Fase 1: Cleanup

- [ ] Borrar `tmp-*.js` de la raíz
- [ ] Commitear archivos pendientes en rama actual

### Fase 2: Quality Gate (pipeline completo)

- [ ] `npm run lint` → 0 errors
- [ ] `npx tsc --noEmit --incremental false` → 0 errors
- [ ] `npm run build` → sin ignoreBuildErrors
- [ ] `npm run test:unit` → ≥445 passed
- [ ] `npx playwright test` → ≥88% passed

### Fase 3: Merge y push

- [ ] Merge rama a master
- [ ] Push master a origin
- [ ] Verificar que CI gate pasa en GitHub Actions

### Fase 4: Deploy y post-smoke

- [ ] Confirmar que Vercel inicia build automático (o correr `vercel --prod`)
- [ ] Esperar build Vercel OK
- [ ] Ejecutar smoke manual: `/api/health`, login, landing tenants

---

## 7. Checklist de Calidad

- [ ] Working tree limpio (sin tmp files, sin uncommitted)
- [ ] Pipeline completo verde (lint + tsc + build + UT + E2E)
- [ ] master actualizado con todos los commits de S1–S2
- [ ] Vercel build exitoso
- [ ] Smoke post-deploy OK (health + login + landing)
- [ ] **Visto bueno del dueño** antes de `done`

---

## 8. Métricas de Éxito

| Métrica                     | Target        | Baseline          |
| --------------------------- | ------------- | ----------------- |
| Commits mergeados a master  | 3 (S1 branch) | 0                 |
| Vercel build status         | ✅ Success    | N/A (no deployed) |
| /api/health en prod         | 200 ok        | ❌ no endpoint    |
| Smoke login prod            | ✅            | ❌ no prod        |
| E2E passed (antes de merge) | ≥88%          | ~66% (137/206)    |

---

## 9. Notas y Riesgos

- **Riesgo:** Vercel puede fallar si `ignoreBuildErrors` fue removido en STRY-019 y quedan errores TS no corregidos → STRY-019 debe certificar build limpio antes de este paso.
- **Riesgo:** Secrets rotados en STRY-019 deben estar actualizados en Vercel env antes del deploy → verificar con `vercel env ls` que las variables tienen fecha reciente.
- **Riesgo:** CI gate (required check) configurado en STRY-018 puede bloquear el merge si E2E no pasó → resolver en STRY-018 primero.
- **Dependencia dura:** Esta US NO se ejecuta hasta que STRY-017, 018 y 019 tengan visto bueno.

---

**Orquestador:** `Implementa STRY-020` → verificar pre-requisitos → Dev (cleanup + commit) → QA (pipeline) → DevOps (merge + deploy + smoke) → **visto bueno** → `done`
