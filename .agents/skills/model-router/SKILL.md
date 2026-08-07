---
name: model-router
description: >-
  Reglas deterministas para elegir qué modelo/trabajador resuelve cada etapa de una entrega
  (local Qwen, Ollama Cloud, OpenCode+Z.ai, Codex, Claude, usuario). Use when Project Lead
  necesita decidir a quién delegar una etapa, o el usuario pregunta "qué modelo debería usar
  para esto". Existe con este nombre exacto para que el skill global story-to-done encuentre un
  override local (misma tabla de niveles, adaptada a los CLIs instalados en esta máquina).
metadata:
  version: "1.0"
  language: es
---

# Skill: Model Router

Reglas deterministas primero. No recorrer niveles innecesariamente — saltar directo al nivel
adecuado cuando la complejidad o el riesgo del paso son evidentes.

Ayuda de decisión ejecutable: `node scripts/model-router.js "<descripción de la tarea>"`
(detecta qué CLIs están realmente instalados en esta máquina: `ollama`, `opencode`, `codex`,
`claude`, y marca cada nivel como disponible/no-disponible).

## Niveles

| # | Trabajador | Usar para | Límites |
|---|------------|-----------|---------|
| 1 | Modelo local (`ollama run qwen2.5-coder`) | Resumir logs, encontrar el primer error real, corregir fixtures/mocks/selectores y tests pequeños, errores triviales de TS/lint | Máx 3 intentos, 1 tarea a la vez, nunca arquitectura ni análisis de repo completo |
| 2 | Ollama Cloud (`OLLAMA_BASE_URL` ya configurado en `apps/web/.env.local` para smart-publish; reutilizable para loops de agente) | Loops repetitivos de UT/integración/smoke/E2E, análisis de traces, generación/reparación de tests, cambios pequeños-medianos | — |
| 3 | OpenCode + Z.ai (`opencode` CLI, `.opencode/agent/project-lead.md`) | Implementación general frontend/backend, historias de complejidad media, coordinación local | — |
| 4 | Codex (`codex` CLI) | Debugging difícil, refactors amplios, concurrencia, cambios entre varios componentes, fallos no resueltos por niveles anteriores | — |
| 5 | Claude (esta sesión / Claude Code) | Arquitectura, requisitos contradictorios, análisis especializado, bloqueos no resueltos por Codex, revisión crítica de alto riesgo | — |
| 6 | Usuario (dueño) | Decisión de negocio, ambigüedad funcional real, credenciales, riesgo de pérdida de datos, cambio destructivo, decisión visual subjetiva, push/merge/deploy productivo | Nunca automatizar esto |

No es obligatorio recorrer todos los niveles. Project Lead salta directo al nivel adecuado
cuando la complejidad/riesgo son evidentes desde Fase 1.

## Cómo delegar (cuando el trabajador no es esta sesión)

Cada nivel 1-4 requiere invocar el CLI correspondiente vía `Bash` (o, bajo Herdr, un tab/pane
nuevo — ver `.agents/protocols/herdr-integration.md`). Antes de delegar:

1. Confirmar que el CLI está instalado: `command -v ollama|opencode|codex`.
2. Dar al trabajador un criterio de aceptación acotado y verificable — no "arréglalo", sino
   "el test X en el archivo Y debe pasar sin modificar Z".
3. Esperar el resultado, verificar el criterio tú mismo (no confiar en el reporte del
   trabajador sin re-ejecutar la validación).
4. Si no hay progreso verificable tras el máximo de intentos del nivel → escalar al siguiente,
   documentando qué se intentó y por qué no funcionó.

## Loop de corrección — límites (idénticos a `story-to-done` global)

- Máximo 3 intentos por nivel.
- Máximo 2 repeticiones consecutivas del mismo error antes de escalar.
- No repetir cambios equivalentes.
- No entrar en loops infinitos.
