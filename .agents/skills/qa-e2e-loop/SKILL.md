---
name: qa-e2e-loop
description: >-
  Bridge skill — no lógica propia. En sass-store, "validar como usuario real" ya está definido
  en .agents/protocols/e2e-validation.md (server lifecycle + validación como persona + loop
  auto-correctivo) y en la Fase 4 de .agents/protocols/story-orchestrator.md. Existe con este
  nombre exacto para que el skill global story-to-done §5 encuentre un override local.
metadata:
  version: "1.0"
  language: es
---

# Skill: qa-e2e-loop (bridge local)

No implementa nada por sí mismo. Si te invocan por este nombre:

1. Sigue **`.agents/protocols/e2e-validation.md`** completo (prerrequisitos de servidor, seed
   por tenant, validación como persona real, árbol de diagnóstico, loop auto-correctivo).
2. Si la actividad viene de `.claude/skills/quality-runner`, sus Fases 4.x ya cubren esto
   (servidor activo, E2E headed→headless, smoke regression, validación de API, aislamiento
   multitenant) — no lo repitas dos veces, verifica que se ejecutó.
3. Si la actividad **no tiene superficie web** (backend puro, job, script), adapta la
   validación a: ejecución real, idempotencia, reintentos, calidad de la salida, integraciones
   externas — mismo principio ("usarlo como lo haría un usuario/consumidor real"), sin forzar
   pasos de navegador que no aplican.
4. Si un criterio de aceptación no tiene test → créalo antes de continuar. Ausencia de test no
   habilita `done`.

Límites heredados de `quality-runner`: máx 3 intentos por error, nunca deshabilitar/borrar un
test para que pase, siempre contra servidor real (nunca solo `page.route()` como gate único).
