---
name: story-orchestrator
description: >-
  Runs the full User Story pipeline for sass-store: PM → Architect → Dev → QA
  per .agents/protocols/story-orchestrator.md and AGENTS.md § 3. Use when the user
  says Implementa, Desarrolla, valida todo (story scope), kilo run story, or asks for a robust testing/QA plan (then extend testing-usuario per AGENTS.md Plan robusto).
---

# Story orchestrator (sass-store)

**Protocolo canónico:** leer y seguir **`.agents/protocols/story-orchestrator.md`** y **`AGENTS.md` § 3** (fases secuenciales, bloque de preguntas inicial, bucle Dev↔QA, notificación pre–visto bueno).

**Si la validación post-implementación falla:** aplicar **`.agents/protocols/e2e-validation.md` §3.0** — diagnosticar, comunicar el plan de fix, reproducir el bug con Playwright CLI headed antes de corregir, y re-validar headed + headless tras el fix.

**Lectura previa típica:**

- `docs/stories/BACKLOG.md`, `docs/stories/active/`
- `.agents/sprint/{STRY-XXX}/plan.md`, `implementacion.md`, `testing-usuario.md`
- Si el usuario pide **plan robusto** / **QA exhaustivo**: `AGENTS.md` (_Plan robusto de testing_) y `docs/TESTING_MASTER_PLAN.md` §12.1+

**Tras entrega verde:** notificar “listo para revisión”; rol **reviewer** → skill **`pr-reviewer`** (`.agents/skills/pr-reviewer/SKILL.md`).
