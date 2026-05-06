# Plan — STRY-020 Release gate y deploy a producción

> Esta US es la última del sprint. Solo se ejecuta cuando STRY-017, 018 y 019 tienen visto bueno del dueño.

## Objetivo

Limpiar el working tree, pasar el quality gate completo, mergear a master y hacer deploy a Vercel con smoke post-deploy exitoso.

## Pre-requisitos (verificar antes de codificar nada)

| Requisito                | Cómo verificar                                                    | Bloqueante                 |
| ------------------------ | ----------------------------------------------------------------- | -------------------------- |
| STRY-017 cerrado         | `implementacion.md` § Definición de listo → todas las casillas ✅ | Sí                         |
| STRY-018 cerrado         | E2E ≥88% y casillas ✅                                            | Sí                         |
| STRY-019 cerrado         | build strict + secrets rotados ✅                                 | Sí                         |
| Rama actual identificada | `git branch --show-current`                                       | No (info)                  |
| Vercel CLI disponible    | `vercel --version` o acceso al dashboard                          | No (alternativa: git push) |

Si algún pre-requisito falla → **parar** y notificar al dueño qué US falta cerrar.

## Orden de ejecución (fases estrictas)

### Fase 1 — Limpieza del working tree (Dev)

**Sin PR, sin review, trabajo local directo en la rama.**

1. Eliminar archivos tmp sueltos:

   ```bash
   rm tmp-get-categories.js tmp-health.js tmp-list-tenants.js tmp-test-categories-api.js
   ```

2. Revisar todos los archivos staged/unstaged con `git diff --stat` y `git status`

3. Commitear los cambios pendientes en **un solo commit** con mensaje claro:

   ```
   chore(release): limpieza pre-deploy y artefactos STRY-018/019/020
   ```

   Archivos a incluir:
   - `.github/workflows/e2e-tests.yml`
   - `apps/web/app/api/debug/seed-e2e/route.ts`
   - `apps/web/app/api/finance/seed/route.ts`
   - `tests/e2e/helpers/test-helpers.ts`
   - `tests/e2e/finance/complete.spec.ts`
   - `apps/web/app/t/[tenant]/finance/budgets/page.tsx`
   - `apps/web/next-env.d.ts`
   - Artefactos sprint `.agents/sprint/`

4. Verificar: `git status` → "nothing to commit, working tree clean"

### Fase 2 — Quality gate completo (QA)

Ejecutar en orden; **no continuar si alguno falla**:

```bash
# 1. Lint
npm run lint
# Meta: 0 errors (warnings tolerados)

# 2. Typecheck
npx tsc --noEmit --incremental false
# Meta: 0 errors

# 3. Build (sin ignoreBuildErrors — ya removido por STRY-019)
npm run build
# Meta: build exitoso

# 4. Unit tests
npm run test:unit
# Meta: ≥445/446 passed

# 5. E2E headless completo
npx playwright test
# Meta: ≥88% passed (≤20 failed de los activos)
```

Si algún paso falla → loop Dev→QA dentro de esta US hasta que pase. No hacer merge con pipeline rojo.

### Fase 3 — Merge a master (DevOps)

```bash
git checkout master
git merge --no-ff auto/1745887834-feat-pos-booking-retouch-cart-inventory \
  -m "feat: S1+S2 release — POS, E2E gate, secrets, build strict, perf/sec audit"
git push origin master
```

**Si hay CI gate required:** esperar que GitHub Actions pase (el E2E workflow debe estar verde).

### Fase 4 — Deploy a Vercel (DevOps)

**Opción A — automático:** push a master dispara deploy en Vercel (si está configurado).
**Opción B — manual:** `vercel --prod` desde `apps/web/`

Verificar en Vercel dashboard que el build completa sin errores.

### Fase 5 — Post-deploy smoke (QA)

Verificar la URL de producción (obtenida de Vercel dashboard):

```bash
PROD_URL="https://[proyecto].vercel.app"  # reemplazar con URL real

# Smoke básico
curl -s "$PROD_URL/api/health" | jq .
# Esperado: {"status":"ok","timestamp":"...","version":"..."}

# Verificar landings
curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/t/wondernails/"
# Esperado: 200

curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/t/centro-tenistico/"
# Esperado: 200

curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/"
# Esperado: 200 (zo-system fallback)
```

Si algún smoke falla → **no marcar done**, investigar y rollback si es necesario (Vercel permite rollback desde dashboard).

## Riesgos

| Riesgo                                                                  | Probabilidad                | Mitigación                                              |
| ----------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------- |
| Build Vercel falla si STRY-019 no quitó ignoreBuildErrors correctamente | Media                       | Verificar localmente con `npm run build` antes del push |
| Secrets no actualizados en Vercel env → runtime errors                  | Alta si STRY-019 incompleto | Verificar `vercel env ls production` antes del deploy   |
| CI gate bloquea merge                                                   | Media                       | E2E debe estar ≥88% (STRY-018)                          |
| Datos prod diferentes a datos E2E                                       | Baja                        | Smoke manual post-deploy                                |

## Asunciones / defaults

- Si el dueño no tiene Vercel CLI: el deploy se hace via git push a master (Vercel detecta automáticamente).
- Si la URL de producción no está definida: buscar en `vercel.json` o en el dashboard de Vercel del proyecto.
- Si el CI gate no está configurado como required: hacer merge directamente tras quality gate local verde.

## Estado

| Fase                       | Estado |
| -------------------------- | ------ |
| Pre-requisitos verificados | [ ]    |
| Fase 1 — Limpieza          | [ ]    |
| Fase 2 — Quality gate      | [ ]    |
| Fase 3 — Merge master      | [ ]    |
| Fase 4 — Deploy Vercel     | [ ]    |
| Fase 5 — Smoke post-deploy | [ ]    |
| Visto bueno dueño          | [ ]    |
