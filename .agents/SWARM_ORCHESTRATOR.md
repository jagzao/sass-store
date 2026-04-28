# Swarm Orchestrator — sass-store

> Documento operativo para agentes AI. Se lee al inicio de cada sesión de desarrollo.
> Propósito: Detectar skill, cargar protocolo, ejecutar fases, documentar métricas.

---

## 1. Detección de Skill

Al recibir una solicitud del usuario:

```
"Implementa [X]" / "Crea [X]" / "Desarrolla [X]" / "Corrige [X]"
```

**Paso 1:** Leer `.agents/skills/definition.json`
- Buscar skill con `useWhen` que coincida con la solicitud.
- Por defecto: usar `feature-developer` para features nuevas.
- Si la solicitud menciona "bug", "error", "fix": usar `debug-agent`.
- Si la solicitud menciona "test", "cobertura": usar `test-generator`.
- Si la solicitud toca schema/DB/auth: usar `multitenant-guard` como pre-check.

**Paso 2:** Leer archivos obligatorios del skill (`protocol.readFirst`)
- `.agents/history/debug_logs.md`
- `.agents/history/test_cases.md`
- `.agents/memory/context_be.md`
- `.agents/protocols/autonomous-loop.md`

---

## 2. Inicialización de Sesión

**Crear o actualizar** `.agents/session/current_task.md` con formato:

```markdown
# Current Task - sass-store

> **Skill:** [feature-developer | debug-agent | test-generator | ci-cd-gate]
> **Feature:** [Nombre]
> **Inicio:** [ISO timestamp]
> **Estado:** EN_PROGRESO

## Plan Técnico

### Archivos a Crear
- [ ] `...`

### Archivos a Modificar
- [ ] `...`

### Tests Necesarios
- [ ] `...`

## Métricas de Ciclo
| Fase | Inicio | Fin | Duración |
|------|--------|-----|----------|
| Planificación | | | |
| Desarrollo | | | |
| Tests UT | | | |
| Tests E2E | | | |
| Corrección | | | |
|**Total** | | | |
```

---

## 3. Ejecución de Fases (Protocolo Autonomous Loop)

### Fase 1: Planificación (manual/LLM)
- Analizar alcance, riesgos, dependencias.
- Actualizar `current_task.md` con plan.
- **Comando de validación:** ninguno; es análisis.

### Fase 2: Desarrollo
- Crear/modificar archivos según plan.
- Después de cada archivo significativo: `npm run lint`.
- Al completar módulo: `npm run agent:build`.
- **Si falla:** capturar error → buscar en `debug_logs.md` → corregir → reintentar (máx 5).
- **Actualizar `current_task.md`** con progreso.

### Fase 3: User Acceptance Test (UAT) — Validación como Persona
- **OBLIGATORIO antes de escribir tests E2E formales.**
- Generar documento UAT desde template: `.agents/templates/USER_ACCEPTANCE_TEST_STEPS.md`
- Guardar en: `docs/UAT/[feature]-uat-[fecha].md`
- Enviar a PO: `npm run agent:uat:send docs/UAT/[feature]-uat-[fecha].md`
- Ejecutar validación "como humano": `npm run agent:uat [feature]`
  - Playwright headed + slow-mo + screenshot por paso.
- **Si un paso falla:** documentar en `debug_logs.md`, corregir código, iterar.
- **Checklist:** Happy Path ✅, errores amigables ✅, <3s por paso ✅.

### Fase 4: Tests Unitarios
- Comando: `npx vitest run --grep [modulo]`
- Cobertura mínima: 80% de archivos nuevos/modificados.
- **Si falla:** verificar si es error conocido en `debug_logs.md` → corregir → reintentar.

### Fase 5: Tests E2E Automatizados (basados en UAT validado)
- Comando: `npm run agent:e2e`
- Se generan **después** de que UAT pase, usando selectores validados.
- El webServer usará `scripts/start-e2e-server.js` (detecta build cache).
- Seed de datos si es necesario (llamar a `/api/debug/seed-e2e` primero).
- **Si falla:** screenshot → corregir → reintentar (máx 5).

### Fase 6: Gate de Calidad (ci-cd-gate)
- Comando: `npm run validate`
- **Si falla:** volver a Fase 2 o 5 según error.
- **Si pasa:** feature lista.

### Fase 7: Documentación y Métricas
- Actualizar `current_task.md` con tiempos reales.
- Si hubo errores nuevos: agregar a `debug_logs.md`.
- Actualizar summaries QA Leader / Architect / Dev Leader / PM.
- Generar video demo si aplica: `npm run agent:e2e -- --video=on`.

---

## 4. Comandos Disponibles para el Agente

| Comando | Descripción | Cuándo usar |
|---------|-------------|-------------|
| `npm run agent:build` | Lint + typecheck + build | Después de escribir código |
| `npx vitest run --grep [modulo]` | Tests unitarios de módulo | Después de cada servicio/API |
| `npm run agent:uat [feature]` | Playwright headed + slow-mo + screenshot | **Fase UAT — validación como humano** |
| `npm run agent:uat:send [ruta]` | Envía UAT por email al PO | Después de generar documento UAT |
| `npm run agent:e2e` | Build + Playwright E2E | Después de UAT validado |
| `npm run validate` | Pipeline completo | Gate final antes de "listo" |
| `npm run agent:ship` | `validate` + mensaje éxito | Último paso |

---

## 5. Reglas de Oro del Orquestador

1. **Nunca declarar feature lista sin `npm run validate` pasando.**
2. **Nunca omitir actualizar `current_task.md` al finalizar.**
3. **Si E2E falla por timeout de servidor, aumentar timeout, no saltarse.**
4. **Si Playwright reporta "No products", activar seed antes de reintentar.**
5. **Máximo 5 intentos de corrección por fase; si persisten, reportar bloqueo.**

---

## 6. Flujo de Trabajo Recomendado para Usuario

### Opción A: User Story completa
```
Implementa [Feature]
Requisitos:
- [requisito 1]
- [requisito 2]
Criterios de aceptación:
- [criterio 1]
Tenant: wondernails
```
→ El orquestador detecta skill → ejecuta todo el ciclo.

### Opción B: Solo un paso
```
Corregir tests E2E de POS
```
→ El orquestador detecta `debug-agent` → corre solo loop de corrección.

### Opción C: Quick check
```
Estado del proyecto: ¿qué falta?
```
→ El orquestador lee `current_task.md` + summaries → reporta.

---

*Versión: 1.0 | Actualizado: 2026-04-28 | Orquestador Feature Developer*
