---
name: bugfix
description: >-
  Ruta rápida para bugs puntuales o chores triviales (1-3 archivos, sin ambigüedad de negocio)
  que no ameritan la ceremonia completa de spec/story. Use when the user reports a specific
  bug ("el botón X no responde", "el filtro Y no aplica") or asks for a small chore, and
  .agents/skills/project-lead routes here from its Fase 2.
metadata:
  version: "1.0"
  language: es
---

# Skill: Bugfix (ruta rápida)

Para cuando `.agents/skills/project-lead/SKILL.md` Fase 2 determina que la actividad es
trivial. Si el alcance crece durante el diagnóstico (toca arquitectura, más de ~5 archivos,
ambigüedad de negocio) → detente y vuelve a Project Lead Fase 2 para reenrutar a
`auto-implement`/`flow`/`story-orchestrator`.

## Pasos

1. **Reproducir.** Antes de tocar código: reproducir el bug con el paso mínimo (curl al
   endpoint, Playwright CLI headed navegando al flujo, o test que falla). Sin reproducción
   confirmada, no hay fix — solo hipótesis.
2. **Localizar la causa raíz.** Grep de todos los callers de la función/componente afectado —
   corregir donde todos los caminos convergen, no parchear un solo caller.
3. **Fix mínimo.** Solo el cambio que resuelve la causa raíz. Nada de refactors adyacentes
   (regla de minimalismo de `autonomous-loop.md`).
4. **Test de regresión.** Si no existe un test que hubiera atrapado este bug, créalo ahora
   (unit si es lógica pura, E2E si es de flujo/UI) — así no reaparece.
5. **Validación focalizada.**
   ```bash
   npm run lint
   npm run typecheck
   npm run test:unit -- --grep "<área tocada>"
   # Si toca UI/API: npm run test:e2e:subset -- --grep "<área tocada>"
   ```
6. **Gate de calidad si el fix toca código productivo compartido:** correr
   `.claude/skills/quality-runner` completo antes de declarar listo. Si el fix es realmente
   aislado (1 archivo, sin efectos colaterales), la validación focalizada del paso 5 basta —
   documentar la decisión en `implementacion.md` o en el `status.json` de la actividad.
7. Continuar con `.agents/skills/project-lead/SKILL.md` Fase 6 (revisión independiente) — el
   tamaño pequeño del cambio no exime de este gate.

## Documentar

Si el bug era real (no un typo trivial), agregar entrada a `.agents/memory/errors.md` con el
mismo formato que las entradas existentes (fecha, área, síntoma, intentos, fix) — evita que se
repita el mismo diagnóstico en el futuro.
