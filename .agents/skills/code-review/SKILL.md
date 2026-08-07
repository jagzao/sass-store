---
name: code-review
description: >-
  Bridge skill — no lógica propia. En sass-store, la revisión independiente combina
  .agents/skills/multi-review (3 perspectivas: QA/Arquitectura/Seguridad) y
  .agents/skills/pr-reviewer (checklist de diff, Result Pattern, multitenancy). Existe con este
  nombre exacto para que el skill global story-to-done §7 encuentre un override local, y es el
  gate que .agents/skills/project-lead/SKILL.md Fase 6 marca como obligatorio.
metadata:
  version: "1.0"
  language: es
---

# Skill: code-review (bridge local)

No implementa nada por sí mismo. Si te invocan por este nombre:

1. **Ejecuta en contexto aislado** — nunca el mismo hilo que implementó el cambio. En Claude
   Code: tool `Agent` con `subagent_type: project-reviewer`
   (`.claude/agents/project-reviewer.md`). En OpenCode/Herdr: worker/tab nuevo.
2. Corre `.agents/skills/multi-review/SKILL.md` (perspectivas QA / Arquitectura / Seguridad
   sobre el diff completo).
3. Corre el checklist de `.agents/skills/pr-reviewer/SKILL.md` (alcance/trazabilidad, Result
   Pattern, multitenancy, rendimiento, tests, calidad de repo).
4. Clasifica cada hallazgo: **blocker / high / medium / low / suggestion** — mismo vocabulario
   que usa `story-to-done` global, para que el orquestador maestro pueda interpretarlo sin
   traducción.
5. Verifica también lo que ni `multi-review` ni `pr-reviewer` cubren explícitamente:
   - Diff completo revisado (no solo los archivos que el implementador mencionó).
   - Cambios innecesarios / fuera de alcance del AC.
   - Secretos o datos sensibles en el diff.
   - Documentación desactualizada por el cambio.

## Salida

Igual al formato de `pr-reviewer` (`## Resumen` / `## Hallazgos` tabla / `## Resultado`), más
una línea de clasificación agregada:

```
Blockers: N | High: N | Medium: N | Low: N | Suggestions: N
Resultado: Approve | Request changes | Block
```

Blocker/high → regresan a implementación (`.agents/skills/project-lead/SKILL.md` Fase 7). El
resto se documenta en `review-findings.md` como deuda conocida si no se corrige de inmediato.
