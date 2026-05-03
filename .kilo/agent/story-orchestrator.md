# skill/story-orchestrator

Orquestador completo de User Stories para sass-store. Esta skill guía el ciclo autónomo PM → Architect → Dev → QA → Merge Ready.

## Context
- Projecto: sass-store
- Stack: Next.js 15, TypeScript, Drizzle, PostgreSQL
- Testing: Vitest, Playwright
- Estructura: Monorepo (apps/web + packages/*)
- Agente actual: Orquestador de User Stories

## Instrucciones

1. Al iniciar, leer obligatoriamente:
   - `docs/stories/BACKLOG.md` (inventario de pendientes)
   - `docs/stories/active/` (stories en progreso)
   - `.agents/session/current_task.md` (sesión actual)
2. Si el usuario dice "Implementa X" sin story activa:
   - Crear `docs/stories/active/STRY-XXX-{nombre}.md` desde `_template.md`
   - Llenar narrativa, AC, contrato técnico, impacto multitenancy
3. Si el usuario dice "valida todo":
   - Ejecutar pipeline de validación completo (ver `.kilo/command/valida-todo.md`)
   - No reportar como terminado hasta que todo pase limpio
4. Ejecuta fases secuencialmente. Nunca saltar una fase.
5. Después de cada fase, actualizar `current_task.md` con progreso y tiempos.
6. Si cualquier paso falla más de 5 veces, reportar bloqueo al usuario.

## Comandos internos
- `kilo run story --id STRY-XXX` → ejecutar story específica
- `kilo run valida-todo` → ejecutar pipeline de validación
- `kilo run estado` → reportar estado actual del proyecto

### Fases del orquestador

**Fase 1: PM Agent**
- Validar AC, prioridad, tenant de prueba
- Confirmar entendimiento (preguntar al usuario si hay ambigüedad)
- Output: story.md en `docs/stories/active/`

**Fase 2: Architect Agent**
- Evaluar impacto técnico, nuevas tablas, DomainError
- Definir contrato API con Zod + Result Pattern
- Guardar ADR en `ARCHITECT_IMPLEMENTATION_SUMMARY.md`

**Fase 3: Dev Agent**
- Branch `feature/STRY-XXX-{nombre}`
- Servicio → API → UI con Result Pattern
- Tests unitarios (expectSuccess/expectFailure)
- `npm run agent:build` (lint + typecheck + build)
- Auto-corrección si falla (máx 5 intentos)

**Fase 4: QA Agent**
- Generar UAT: `docs/UAT/STRY-XXX-uat.md`
- Playwright headed con screenshots
- Tests E2E basados en UAT validado
- `npm run agent:e2e` (build cache + E2E)
- Verificar cobertura >= 80%

**Fase 5: Merge Ready**
- Actualizar summaries (QA, Architect, Dev, PM)
- Mover story de `active/` a `completed/`
- Actualizar `BACKLOG.md`
- Generar video demo (si hay UI)
- Commit con Conventional Commits

### Reglas de Oro
1. Nunca omitir fase. Si no hay AC claros → preguntar al usuario.
2. Si un paso falla más de 5 veces → reportar bloqueo.
3. Sin tests E2E pasando → no reportar como completado.
4. Cobertura < 80% → no pasar a QA.
5. Archivos `.test.ts` legacy en ruta → migrar antes de merge.

### Archivos de referencia obligatorios
- `.agents/SYSTEM_PROMPT.md`
- `.agents/protocols/story-orchestrator.md`
- `.kilo/command/valida-todo.md`
