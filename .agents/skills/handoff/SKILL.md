---
name: handoff
description: Generate a concise handoff package for another agent to continue the workflow with minimal token usage. Use when a stage is complete and work continues with a different agent.
metadata:
  version: "1.0"
  language: es
---

# Skill: Agent Handoff

## FASE 1 — Recopilar contexto
Leer:
- `.agents/memory/current-task.md`
- `.agents/memory/decisions.md`
- `.agents/memory/errors.md`
- `.agents/memory/workflow-state.json`

## FASE 2 — Generar handoff

```markdown
# Agent Handoff
## 1. Etapa actual: [spec|test-spec|implementation|test-implementation|quality-runner|pr-ready]
## 2. Objetivo: [1-2 lineas]
## 3. Completado: - [items]
## 4. Falta: - [items con criterio de listo]
## 5. Archivos relevantes: - [ruta exacta] — [para que]
## 6. Decisiones: - [resumidas]
## 7. Errores: - [resumidos con estado]
## 8. Comandos ejecutados: (bloque bash)
## 9. Restricciones: no cambiar negocio | no borrar tests | seguir AGENTS.md | no PR sin quality-runner | Result Pattern obligatorio
## 10. Siguiente agente: [claude|kimi|cualquiera] — motivo
## 11. Prompt exacto:
  Sigue AGENTS.md. Continua desde: [etapa].
  Contexto: [2-3 lineas]
  Tareas: 1. ... 2. ... 3. ...
  No hagas PR. No saltes etapas.
```

## FASE 3 — Actualizar memoria
- `.agents/memory/handoff.md` ← reemplazar con handoff generado
- `.agents/memory/workflow-state.json` ← actualizar `currentStage`, `lastAgent`, `nextRecommendedAgent`
- `.agents/memory/current-task.md` ← actualizar instruccion para proximo agente

## Reglas
- Breve. No copiar la spec completa.
- Rutas exactas de archivos.
- El prompt del paso 11 debe ser ejecutable directamente sin preguntas.
- Para este proyecto: incluir `STRY-XXX` si aplica, y rutas de `.agents/sprint/{id}/`.
