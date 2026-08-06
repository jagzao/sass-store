---
name: implement-story
description: >-
  Bridge skill — no lógica propia. En sass-store, "implementar la historia" se resuelve con el
  pipeline que elige .agents/skills/project-lead/SKILL.md Fase 2 (bugfix / auto-implement /
  story-orchestrator / flow). Existe con este nombre exacto para que el skill global
  story-to-done (~/.config/opencode/skills/story-to-done/SKILL.md §3) encuentre un override
  local, tal como exige su regla "reglas locales tienen prioridad".
metadata:
  version: "1.0"
  language: es
---

# Skill: implement-story (bridge local)

No implementa nada por sí mismo. Si te invocan por este nombre:

1. Ve a `.agents/skills/project-lead/SKILL.md` Fase 2 (routing determinista) y ejecútala con la
   actividad recibida.
2. El pipeline elegido (`.agents/skills/bugfix`, `.claude/skills/auto-implement`,
   `.agents/protocols/story-orchestrator.md`, o `.claude/skills/flow`) hace la implementación
   real: código + tests unitarios + build/lint/typecheck del alcance.
3. Al terminar, continúa en Project Lead Fase 5 (QA como persona real) — no te detengas aquí
   como si fuera el final del trabajo.

No dupliques aquí ninguna instrucción de esos skills; si necesitas ajustar cómo se implementa,
edita el skill correspondiente, no este bridge.
