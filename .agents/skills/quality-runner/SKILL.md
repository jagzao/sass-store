---
name: quality-runner
description: Full quality validation pipeline — last gate before PR. Verifies Gherkin scenario coverage, runs build+lint+typecheck+tests+coverage+E2E+regression, auto-corrects up to 3 times, then creates PR automatically if all gates pass.
metadata:
  version: "2.0"
  language: es
---

# Skill: Quality Runner

## LÍMITES DE EJECUCIÓN (Furnace limits — se aplican antes de cualquier fase)

```
max_iterations_por_error : 3
max_autocorrecciones_total: 10        # si se superan → DETENER, reportar todo como BLOQUEANTE
max_archivos_modificados  : 20        # monorepo — más archivos permitidos que proyectos simples
tiempo_limite_estimado    : 45 min    # pipeline más largo por monorepo

allowed_paths:
  - apps/web/app/
  - apps/web/components/
  - packages/
  - tests/
  - scripts/

forbidden_paths:
  - .claude/
  - .agents/
  - .github/
  - drizzle/migrations/
  - deploy/
  - cloudflare/
  - apps/web/app/api/debug/   # seeds/debug — solo entornos no productivos
  - **/*.production.*
  - **/*.prod.*
```

Si un fix requiere modificar un `forbidden_path` → **DETENER INMEDIATAMENTE**, reportar como BLOQUEANTE y esperar decisión humana.
El agente que implementa **no controla el criterio de éxito** — ese criterio son estos límites + los gates de cobertura, no el exit code solo.

---

## REGLAS ABSOLUTAS
1. No abrir PR si alguna validación falla.
2. No ocultar errores ni silenciar con `|| true`.
3. No borrar tests para que pasen.
4. No relajar assertions sin justificar en `decisions.md`.
5. No modificar reglas de negocio de la spec.
6. No cambiar test-spec sin aprobación humana.
7. Solo corregir código productivo si el error está confirmado por un test.
8. Si el fallo es ambiguo → DETENER y preguntar al humano.
9. Máximo 3 intentos por error. Si persiste → BLOQUEANTE.
10. No cambiar arquitectura.
11. Después de cualquier fix en código productivo → re-ejecutar pipeline completo desde FASE 3.
12. E2E siempre contra servidor real local — nunca con `page.route()` como único gate.

## FASE 1 — Validar contexto

Leer `.agents/memory/workflow-state.json`. Verificar:
- `specStatus: "done"` ✅
- `testSpecStatus: "done"` ✅
- `implementationStatus: "done"` ✅
- `testImplementationStatus: "done"` ✅

Si alguno falta → DETENER, indicar qué etapa ejecutar primero.

## FASE 2 — Verificar cobertura de Scenarios Gherkin

Leer `.agents/sprint/{STRY-XXX}/test-matrix.md`.

```
Scenarios totales:      N
Tests implementados:    N  (estado ✅)
Tests bloqueados:       N  (estado ⚠️ — requieren justificación)
Tests pendientes:       N  (estado ⬜ — BLOQUEAN el PR)
```

Si hay cualquier ⬜ sin test → **BLOQUEAR**: no continuar hasta que `/test-implementation` los cubra.

## FASE 3 — Validaciones base (en orden)

Registrar cada resultado: ✅ OK | ⚠️ Warnings | ❌ Falló

```bash
# 1. Formato
npx prettier --write "apps/**/*.{ts,tsx}" "packages/**/*.{ts,tsx}"

# 2. Lint
npm run lint

# 3. Typecheck
npm run typecheck

# 4. Build
npm run build

# 5. Unit tests
npm run test:unit

# 6. Integration tests (si aplica)
npm run test:integration

# 7. Security tests (si aplica)
npm run test:security

# 8. Coverage — gate obligatorio
npm run test:coverage
```

### Gate de coverage
Leer el reporte de coverage. Si cualquier path crítico está por debajo del umbral → BLOQUEANTE:

| Scope | Umbral mínimo |
|-------|---------------|
| Lógica de dominio nueva | 80% |
| API routes nuevas | 75% |
| Componentes UI nuevos | 60% |

## FASE 4 — Validaciones E2E (solo si FASE 3 pasó)

### 4.1 — Verificar servidor activo

```bash
curl -s http://localhost:3001/api/health
```

Si falla → reportar BLOQUEANTE (el servidor no está corriendo — iniciar con `npm run dev` y esperar health check).

### 4.2 — E2E del feature (headed primero, luego headless)

```bash
# Headed — inspección visual de los Scenarios del feature
npm run test:e2e:subset -- --headed --grep "{STRY-XXX}"

# Headless — gate CI
npm run test:e2e:subset -- --grep "{STRY-XXX}"
```

En caso de fallo headless: los screenshots y traces de Playwright están en `playwright-report/` — leerlos antes de diagnosticar.

### 4.3 — Smoke regression (rutas existentes)

```bash
npm run test:e2e:subset -- --grep "smoke"
```

Verifica que el feature nuevo no rompió nada existente. Si no hay smoke tests → correr al menos:

```bash
# Rutas críticas mínimas
npm run test:e2e:subset -- --grep "auth|booking|finance|inventory"
```

### 4.4 — API validation (si hay rutas nuevas)

Para cada endpoint nuevo, verificar manualmente:
```bash
# Happy path
curl -s -X [METHOD] http://localhost:3001/api/[ruta] \
  -H "Content-Type: application/json" \
  -d '[payload]' | jq .

# Error path
curl -s -X [METHOD] http://localhost:3001/api/[ruta] \
  -H "Content-Type: application/json" \
  -d '[payload inválido]' | jq .
```

Verificar: status code correcto, payload con `success: true/false`, no se filtra stack trace, no se filtra datos de otro tenant.

### 4.5 — Multitenant isolation (si toca datos)

Repetir escenarios críticos con credenciales de tenants distintos. Un tenant NO debe ver ni modificar datos de otro.

## FASE 5 — Loop de corrección (máx 3 intentos por error)

1. Leer error completo — no asumir la causa
2. Clasificar:
   - Compilación / bug claro en código nuevo → corregir código mínimo
   - Test mal escrito → corregir test (no borrarlo)
   - Regla de negocio ambigua → **DETENER y preguntar al humano**
   - Problema de entorno (DB, Docker, puertos) → reportar como BLOQUEANTE de entorno
3. Aplicar corrección mínima
4. Re-ejecutar validación específica
5. Si sigue fallando al intento 3 → BLOQUEANTE, documentar en `errors.md`

Si se aplicó cualquier fix a código productivo → **volver a FASE 3 completa** antes de continuar.

## FASE 6 — Generar PR body

Si todas las validaciones pasaron, generar `.agents/sprint/{STRY-XXX}/pr-body.md`:

```markdown
## Story
{STRY-XXX} — {descripción del feature}

## Cambios
[lista de archivos clave creados/modificados con una línea de descripción]

## Scenarios cubiertos
[tabla completa de test-matrix.md]

## Validaciones
| Validación       | Resultado | Notas |
|------------------|-----------|-------|
| prettier         | ✅        |       |
| lint             | ✅        |       |
| typecheck        | ✅        |       |
| build            | ✅        |       |
| test:unit        | ✅        |       |
| test:integration | ✅/N/A    |       |
| test:security    | ✅/N/A    |       |
| coverage         | ✅ XX%    |       |
| E2E feature      | ✅        |       |
| smoke regression | ✅        |       |

## Test plan
- [ ] Revisar PR diff
- [ ] Confirmar que smoke tests pasan en staging
- [ ] Aprobar y mergear

🤖 Generado con /quality-runner | /flow por Claude Code
```

## FASE 7 — Reporte final y PR automático

```markdown
# Reporte Quality Runner — {STRY-XXX}
**Resultado:** ✅ LISTO PARA PR / ❌ BLOQUEADO

[tabla de validaciones]

**Correcciones aplicadas:** [lista o "ninguna"]
**Errores bloqueantes:** [lista o "ninguno"]
```

Si `✅ LISTO PARA PR`:

```bash
git add [archivos específicos — no git add -A]
git commit -m "feat({scope}): {descripción}

Story: {STRY-XXX}
Scenarios: SC-01, SC-02, SC-03

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin HEAD

gh pr create \
  --title "feat({scope}): {descripción corta}" \
  --body "$(cat .agents/sprint/{STRY-XXX}/pr-body.md)"
```

Actualizar `.agents/memory/workflow-state.json`:
```json
{
  "qualityRunnerStatus": "done",
  "prReady": true,
  "currentStage": "pr-ready",
  "lastAgent": "quality-runner"
}
```

Reportar URL del PR al usuario.

## Notas específicas del proyecto
- `npm run test:e2e:subset -- --grep "X"` en lugar de toda la suite.
- Para regresión multitenant: ejecutar por cada tenant activo (wondernails, zo-system).
- Si falla por timeout DB: revisar Docker Postgres o variables de entorno.
- Result Pattern: si un test unitario falla por tipo `Result<T,E>` → corregir imports de `@sass-store/core/src/result`.
- Screenshots de fallos Playwright: `playwright-report/` — siempre revisar antes de diagnosticar.
