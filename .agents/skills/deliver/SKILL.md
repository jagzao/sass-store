---
name: deliver
description: >-
  Entrypoint directo al Project Lead de sass-store. Use when the user types "/deliver" followed
  by an activity description ("/deliver Implementa esta actividad y déjala lista para deploy").
  Equivalent to the global OpenCode command ~/.config/opencode/commands/deliver.md but scoped to
  this repo's own pipeline.
argument-hint: "<actividad a entregar>"
metadata:
  version: "1.0"
  language: es
---

# /deliver

Carga y ejecuta **`.agents/skills/project-lead/SKILL.md`** de punta a punta con la actividad
recibida como entrada.

Actividad solicitada:

$ARGUMENTS

Reglas:

- Si `$ARGUMENTS` está vacío, pedir una frase describiendo la actividad antes de continuar.
- Respetar las reglas y skills propios del proyecto (`.agents/project-profile.md`) por encima
  de cualquier default genérico.
- No aceptar una entrega parcial como `done` (ver Project Lead Fase 8).
- Mismo comportamiento tanto si el usuario invoca `/deliver` directamente en esta sesión como
  si la actividad llega delegada desde el orquestador maestro global.
