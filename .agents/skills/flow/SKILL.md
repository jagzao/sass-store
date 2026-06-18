---
name: flow
description: Full autonomous development pipeline orchestrator. Runs spec → test-spec → implement → test-implementation → quality-runner → PR with a single human approval gate after spec. Use when the user says "/flow", "flujo completo", "implementa de punta a punta", or provides a user story to develop autonomously.
argument-hint: "<user story o descripción del feature>"
metadata:
  version: "1.0"
  language: es
---

# Skill: Flow — Orquestador Autónomo

Este skill ejecuta el pipeline completo de desarrollo con un solo punto de parada humana.

```
/flow "historia"
  ├── [AUTO] /spec       → Gherkin + spec funcional
  ├── [⏸ PAUSA]         → Aprobación humana obligatoria
  ├── [AUTO] /test-spec  → Matriz Gherkin → tests
  ├── [AUTO] /implement  → Código productivo Result Pattern
  ├── [AUTO] /test-impl  → Tests desde matriz
  ├── [AUTO] /quality-runner → lint+build+coverage+E2E+regression
  └── [AUTO] gh pr create → PR abierto si ✅ LISTO
```

---

## FASE 1 — Recibir historia de usuario

Si el argumento está vacío, preguntar:
```
¿Cuál es la historia de usuario o feature a implementar?
Ejemplo: "Como admin quiero poder archivar productos para que no aparezcan en el booking"
```

## FASE 2 — Inicializar sesión

1. Leer `.agents/sprint/` para determinar el siguiente ID (STRY-XXX).
2. Crear carpeta `.agents/sprint/{STRY-XXX}/`.
3. Escribir `.agents/memory/workflow-state.json`:

```json
{
  "currentFeature": "[descripción corta]",
  "currentStage": "spec",
  "storyId": "STRY-XXX",
  "lastAgent": "flow",
  "nextRecommendedAgent": "",
  "specStatus": "pending",
  "testSpecStatus": "pending",
  "implementationStatus": "pending",
  "testImplementationStatus": "pending",
  "qualityRunnerStatus": "pending",
  "humanApprovalRequired": true,
  "prReady": false,
  "lastUpdated": "[ISO timestamp]",
  "blockers": []
}
```

## FASE 3 — Ejecutar /spec

Invocar **Skill: spec** con la historia de usuario como entrada.

El skill spec finalizará con la spec + Gherkin scenarios guardados en `.agents/sprint/{STRY-XXX}/plan.md`.

## FASE 4 — [⏸ ÚNICA PAUSA HUMANA]

Mostrar al usuario:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✋ APROBACIÓN REQUERIDA — Spec lista
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Revisa la especificación en:
  .agents/sprint/{STRY-XXX}/plan.md

Responde:
  ✅ "aprobado" — continuar pipeline automático
  ✏️  correcciones en texto — volver a refinar spec
  ❌ "cancelar" — detener el flujo
```

Esperar respuesta. Si hay correcciones → volver a FASE 3 con las correcciones como input.

## FASE 5 — Pipeline automático (sin pausas salvo bloqueantes)

Ejecutar en secuencia. Si un paso produce BLOQUEANTE → pausar, reportar al usuario, esperar instrucción.

### 5.1 — Invocar Skill: test-spec
- Entrada: spec de `.agents/sprint/{STRY-XXX}/plan.md`
- Salida esperada: `.agents/sprint/{STRY-XXX}/test-spec.md` + `.agents/sprint/{STRY-XXX}/test-matrix.md`
- Continuar cuando `workflow-state.json → testSpecStatus = "done"`

### 5.2 — Invocar Skill: implement
- Entrada: plan.md + test-spec.md + test-matrix.md
- Continuar cuando `workflow-state.json → implementationStatus = "done"`

### 5.3 — Invocar Skill: test-implementation
- Entrada: test-matrix.md + implementación ya escrita
- Continuar cuando `workflow-state.json → testImplementationStatus = "done"`

### 5.4 — Invocar Skill: quality-runner
- Continuar cuando `workflow-state.json → qualityRunnerStatus = "done"` y `prReady = true`
- Si `prReady = false` → BLOQUEANTE, mostrar reporte al usuario

## FASE 6 — Crear PR automáticamente

Si `prReady = true`:

```bash
git add -A
git commit -m "feat({scope}): {descripción corta del feature}

{resumen de cambios}

Story: {STRY-XXX}
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin HEAD

gh pr create \
  --title "feat: {descripción}" \
  --body "$(cat .agents/sprint/{STRY-XXX}/pr-body.md)"
```

El archivo `pr-body.md` debe generarse con:

```markdown
## Story
{STRY-XXX} — {descripción}

## Cambios
- [lista de archivos clave creados/modificados]

## Scenarios cubiertos
[tabla de test-matrix.md]

## Validaciones
[tabla del reporte de quality-runner]

## Test plan
- [ ] Smoke tests pasan en headed
- [ ] E2E del feature pasan en headless
- [ ] Regression suite pasa sin nuevos fallos
- [ ] Coverage ≥ 80% en paths críticos

🤖 Generado con /flow por Claude Code
```

## FASE 7 — Reporte final al usuario

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PIPELINE COMPLETADO — {STRY-XXX}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Feature: {descripción}
PR:      {URL del PR}

Resumen:
  spec              ✅
  test-spec         ✅
  implementación    ✅  ({N} archivos)
  tests             ✅  ({N} tests creados)
  quality-runner    ✅  ({N} validaciones)

Pendiente de revisión humana antes de merge.
```

---

## Reglas del orquestador

- Solo un punto de parada humana: aprobación de spec.
- Si cualquier skill produce BLOQUEANTE → pausar y reportar, no inventar soluciones.
- No hacer merge, solo abrir PR.
- No modificar spec aprobada sin nueva aprobación humana.
- Registrar cada transición en `workflow-state.json`.
