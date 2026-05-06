# Implementación — STRY-020 Release gate y deploy

> Trazabilidad CA → acciones → evidencia.

## Criterios de aceptación

| CA   | Descripción         | Acción                                   | Verificación                 |
| ---- | ------------------- | ---------------------------------------- | ---------------------------- |
| CA-1 | Working tree limpio | rm tmp-\*.js + commit cambios pendientes | `git status` → clean         |
| CA-2 | Quality gate verde  | lint + tsc + build + UT + E2E            | Todos pasan                  |
| CA-3 | Merge a master      | `git merge --no-ff`                      | `git log master` actualizado |
| CA-4 | Deploy Vercel       | push master o `vercel --prod`            | Build Vercel exitoso         |
| CA-5 | Post-smoke prod     | curl health + landings                   | 200 en todos                 |

---

## Checklist pre-ejecución (agente verifica antes de empezar)

```bash
# 1. ¿STRY-017 cerrado? (todas las casillas en implementacion.md)
grep -c "\- \[x\]" .agents/sprint/STRY-017-platform-perf-sec/implementacion.md
# Debe ser ≥6

# 2. ¿STRY-018 cerrado? (E2E ≥88%)
grep -c "\- \[x\]" .agents/sprint/STRY-018-e2e-recovery-ci-gate/implementacion.md
# Debe ser ≥7

# 3. ¿STRY-019 cerrado? (build strict + secrets)
grep -c "\- \[x\]" .agents/sprint/STRY-019-secrets-observability/implementacion.md
# Debe ser ≥8

# 4. ¿Working tree tiene pendientes?
git status --short

# 5. ¿ignoreBuildErrors removido?
grep "ignoreBuildErrors" apps/web/next.config.js && echo "PENDIENTE" || echo "OK"
```

Si algún check falla → notificar al dueño y no continuar.

---

## Fase 1 — Limpieza del working tree

### 1.1 — Eliminar archivos tmp

```bash
rm -f tmp-get-categories.js tmp-health.js tmp-list-tenants.js tmp-test-categories-api.js
```

### 1.2 — Revisar cambios pendientes

```bash
git status
git diff --stat
```

Archivos conocidos con cambios (ver git status al inicio de sesión):

| Archivo                                                          | Tipo            | Incluir en commit         |
| ---------------------------------------------------------------- | --------------- | ------------------------- |
| `.agents/sprint/STRY-001-pos-robusto-e2e/testing-usuario.md`     | staged+unstaged | Sí                        |
| `.agents/sprint/STRY-018-e2e-recovery-ci-gate/implementacion.md` | unstaged        | Sí                        |
| `.claude/settings.local.json`                                    | unstaged        | No (ignorar o .gitignore) |
| `.github/workflows/e2e-tests.yml`                                | staged          | Sí                        |
| `apps/web/app/api/debug/seed-e2e/route.ts`                       | staged          | Sí                        |
| `apps/web/app/api/finance/seed/route.ts`                         | nuevo staged    | Sí                        |
| `apps/web/app/t/[tenant]/finance/budgets/page.tsx`               | unstaged        | Sí                        |
| `apps/web/next-env.d.ts`                                         | unstaged        | Sí (auto-generado)        |
| `playwright-report/index.html`                                   | unstaged        | No (.gitignore)           |
| `tests/e2e/finance/complete.spec.ts`                             | unstaged        | Sí                        |
| `tests/e2e/helpers/test-helpers.ts`                              | staged          | Sí                        |

**Verificar que `playwright-report/` está en `.gitignore`:**

```bash
grep "playwright-report" .gitignore || echo "AGREGAR playwright-report/ a .gitignore"
```

### 1.3 — Commit de limpieza

```bash
git add .github/workflows/e2e-tests.yml \
  apps/web/app/api/debug/seed-e2e/route.ts \
  apps/web/app/api/finance/seed/route.ts \
  apps/web/app/t/[tenant]/finance/budgets/page.tsx \
  apps/web/next-env.d.ts \
  tests/e2e/finance/complete.spec.ts \
  tests/e2e/helpers/test-helpers.ts \
  ".agents/sprint/"

git commit -m "chore(release): limpieza pre-deploy + artefactos sprint S1-S2 (STRY-018/019/020)"
```

### 1.4 — Verificar clean

```bash
git status
# Esperado: "nothing to commit, working tree clean"
```

---

## Fase 2 — Quality gate completo

Ejecutar y documentar resultado en la tabla al final de esta sección.

```bash
# Lint
npm run lint 2>&1 | tail -5

# Typecheck
npx tsc --noEmit --incremental false 2>&1 | tail -10

# Build
npm run build 2>&1 | tail -20

# Unit tests
npm run test:unit 2>&1 | tail -5

# E2E headless
npx playwright test 2>&1 | tail -10
```

### Resultado quality gate

| Paso         | Comando               | Resultado  | Estado |
| ------------ | --------------------- | ---------- | ------ |
| Lint         | `npm run lint`        | (rellenar) | [ ]    |
| Typecheck    | `tsc --noEmit`        | (rellenar) | [ ]    |
| Build        | `npm run build`       | (rellenar) | [ ]    |
| Unit tests   | `npm run test:unit`   | (rellenar) | [ ]    |
| E2E headless | `npx playwright test` | (rellenar) | [ ]    |

---

## Fase 3 — Merge a master

```bash
# Verificar estado actual
git log --oneline master..HEAD

# Merge (no fast-forward para preservar historia)
git checkout master
git merge --no-ff auto/1745887834-feat-pos-booking-retouch-cart-inventory \
  -m "feat(release): S1+S2 — POS robusto, E2E gate, secrets, build strict, sec audit [STRY-001/017/018/019]"

# Verificar
git log --oneline -5
```

**Si hay conflict:** resolverlo y continuar el merge. No usar `--strategy=ours`.

---

## Fase 4 — Deploy a Vercel

```bash
# Opción A: push a master (si Vercel está conectado al repo)
git push origin master

# Opción B: deploy manual
cd apps/web && vercel --prod
```

**Monitorear en:** vercel.com/dashboard → proyecto → Deployments → último deployment

Esperar status `Ready` antes de continuar.

---

## Fase 5 — Post-deploy smoke

```bash
PROD_URL="https://[REEMPLAZAR_CON_URL_VERCEL]"

# Health
echo "=== Health ===" && curl -s "$PROD_URL/api/health" | jq .

# Landings tenant
echo "=== wondernails ===" && curl -s -o /dev/null -w "HTTP %{http_code}\n" "$PROD_URL/t/wondernails/"
echo "=== centro-tenistico ===" && curl -s -o /dev/null -w "HTTP %{http_code}\n" "$PROD_URL/t/centro-tenistico/"
echo "=== root ===" && curl -s -o /dev/null -w "HTTP %{http_code}\n" "$PROD_URL/"
```

**Resultado smoke:**

| URL                    | HTTP esperado | HTTP real  | Estado |
| ---------------------- | ------------- | ---------- | ------ |
| `/api/health`          | 200 + JSON ok | (rellenar) | [ ]    |
| `/t/wondernails/`      | 200           | (rellenar) | [ ]    |
| `/t/centro-tenistico/` | 200           | (rellenar) | [ ]    |
| `/`                    | 200           | (rellenar) | [ ]    |

---

## Definición de listo

- [ ] `git status` → working tree clean
- [ ] `git log master` contiene los 3 commits de la feature branch
- [ ] Lint 0 errors
- [ ] tsc 0 errors
- [ ] Build sin ignoreBuildErrors exitoso
- [ ] UT ≥445/446 passed
- [ ] E2E ≥88% passed headless
- [ ] Vercel build status: Ready
- [ ] Smoke prod: health + 3 landings con 200
- [ ] **Visto bueno del dueño** → marcar story `done`
