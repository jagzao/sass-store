# Protocolo del Orquestador de User Stories

> Orquestador: **Fase 0** → PM → Architect → Dev **⟲** QA → **notificación** → reviewer / visto bueno → Done + push  
> Versión: **1.6**  
> Estado: VIGENTE  
> Reglas de autonomía alineadas con `AGENTS.md` § 3.

---

## Trigger

Cuando el usuario dice:

- `Implementa [Feature]`
- `Desarrolla [Feature]`
- `Implementa STRY-XXX`
- `valida todo`
- `kilo run story --id STRY-XXX`
- `plan robusto`, `testing robusto`, `QA exhaustivo` (sobre una US o la app): ampliar `plan.md` / `testing-usuario.md` según `AGENTS.md` (Plan robusto de testing) y `docs/TESTING_MASTER_PLAN.md` §12.1 y §13–§15

El orquestador lee `docs/stories/BACKLOG.md` y `docs/stories/active/` para determinar la story a ejecutar.

---

## Principios (autonomía)

1. **Fases en orden estricto:** no saltar; no iniciar Dev (código de negocio) sin Architect cerrado; no cerrar Dev sin pasar por QA según `AGENTS.md`.
2. **Sin autorización intermedia:** el agente **no** pregunta “¿sigo con la siguiente fase?” al dueño entre PM → Architect → Dev → QA.
3. **Preguntas al inicio:** en **Fase 0 / inicio de Fase 1**, un **solo bloque** con **todas** las preguntas abiertas **o** la declaración “cero preguntas”. **Solo si el dueño no responde en ese turno**, documentar **defaults comentados** en `plan.md` (Asunciones / defaults) y **continuar**; si respondió, **no** reemplazar sus respuestas por asunciones. Salvo decisión técnica irresoluble (dos diseños incompatibles sin criterio en US/plan) → **sí** pedir una decisión al dueño.
4. **`plan.md` completo antes de codificar en serio:** orden numerado, rutas/capas, criterios de hecho por paso, riesgos — suficiente para implementación **de inicio a fin** sin adivinar.
5. **Bucle Dev ⟲ QA:** fallo en QA → Dev corrige → QA de nuevo, **sin** permiso del dueño por iteración; tope **5 ciclos completos** Dev→QA; si tras eso sigue rojo → **bloqueo** documentado (síntoma, logs, siguiente acción sugerida).
6. **Notificación:** con build + lint + typecheck + UT + Playwright (headed + headless según `AGENTS.md` § 1.3) **verdes**, el agente **avisa al usuario** que la entrega está **implementada y validada por el agente** y que queda **pendiente reviewer / visto bueno** para merge/`done`/deploy.

---

## Fase 0: Detección + amarrar alcance

```
1. ¿Existe STRY-XXX en docs/stories/active/ para este feature?
   ├── Sí → Leer, confirmar scope
   └── No → Crear story desde _template.md (PM), guardar en active/
2. Carpeta de sprint:
   .agents/sprint/{STRY-XXX-nombre-corto}/
   ├── plan.md          ← debe quedar COMPLETO (pasos numerados, asunciones)
   ├── implementacion.md
   └── testing-usuario.md
   → Si falta: crear; si existe: completar huecos antes de Fase 2
3. Bloque único de aclaraciones (ver Principios §3): preguntas al dueño O cero + asunciones en plan.md
4. Solo entonces → Fase 1 (PM formal) o fusionar PM aquí si la story ya está madura
```

### Entrada: reunión u observaciones

Si el input es acta de reunión o notas sueltas:

1. Incorporar a la story en curso **o** nueva STRY; actualizar `plan.md` / AC / `testing-usuario.md`.
2. Volver a ejecutar **bloque de preguntas** si aparecen nuevas ambigüedades.

---

## Fase 1: PM Agent — Análisis

### Responsabilidad

AC claros, prioridad, tenants de prueba; **`plan.md` listo para el codificador**.

### Checklist

- [ ] Story en `docs/stories/active/`
- [ ] `.agents/sprint/{STRY-XXX}/` con los tres `.md`
- [ ] AC sin placeholders críticos
- [ ] **`plan.md`:** pasos **numerados**, alcance, dependencias, sección **Asunciones / defaults** si aplica
- [ ] Bloque de aclaraciones **emitido** (preguntas o “cero preguntas”)

### Output

- **No** esperar micromensajes de aprobación para pasar a Fase 2.
- Si ambigüedad de **negocio** sin respuesta: asunción en `plan.md` y seguir.
- Si **decisión técnica irresoluble**: documentar opciones A/B y **pausar** con una sola pregunta al dueño.

---

## Fase 2: Architect Agent — Diseño Técnico

### Responsabilidad

Contrato técnico y riesgos; cerrar diseño en `plan.md` / `implementacion.md`.

### Checklist

- [ ] Tablas / `tenant_id` / RLS si aplica
- [ ] DomainError / Zod / `withResultHandler` donde aplique
- [ ] Deuda técnica identificada
- [ ] ADR breve en `ARCHITECT_IMPLEMENTATION_SUMMARY.md` si hay decisión de arquitectura

### Output

→ **Fase 3** sin pedir OK al dueño.

---

## Fase 3: Dev Agent — Implementación

### Responsabilidad

Código + tests unitarios + build/lint/typecheck del alcance.

### Secuencia

```
1. Branch: feature/STRY-XXX-nombre
2. Servicio (Result Pattern) + UT
3. API withResultHandler + tests integración si aplica
4. UI si aplica
5. npm run build / lint / typecheck (o agent:build del repo)
6. current_task.md + implementacion.md al día
7. Tramo de plan marcado hecho → pasar a Fase 4 (no “cerrar” sin QA)
```

### Output

→ **Fase 4** obligatoria tras codificación del tramo (`AGENTS.md` transición tras codificación).

---

## Fase 4: QA Agent — Validación (Playwright CLI + UT)

### Responsabilidad

UAT documentado + E2E; **todo** por el agente.

### Secuencia

```
0. Entorno arriba (dev o start-e2e-server)
1. testing-usuario.md alineado a US/CA
2. Acceso por cada tenant del doc (jagzao@gmail.com / admin salvo US)
3. Playwright --headed sobre escenarios del doc → fix si falla
4. AC cotejados con implementacion.md
5. tests/e2e alineados al doc (grep STRY-XXX o tag)
6. Playwright headless verde
7. Cobertura objetivo según AGENTS.md
```

### Bucle Dev ⟲ QA (autónomo)

```
Si paso 3–7 falla:
  → Volver a Fase 3 (corregir código / datos / tests)
  → Re-ejecutar Fase 4 desde el paso mínimo necesario (normalmente desde 3 o 6)
Repetir hasta VERDE o hasta 5 ciclos completos Fase3→Fase4
```

### Output

- Con **verde:** mensaje al usuario: **implementado y validado por el agente**; pendiente **reviewer** + **visto bueno** dueño para `done`/merge/deploy.
- Con **rojo tras 5 ciclos:** reporte de bloqueo.

---

## Fase 5: Listo para reviewer + visto bueno del dueño (pre-done)

### Checklist

- [ ] Evidencia: comandos Playwright + UT + build/lint/tc
- [ ] PR o diff enlazado para **reviewer** (humano o agente con skill **`pr-reviewer`**: `.agents/skills/pr-reviewer/SKILL.md`)
- [ ] **No** pedir al dueño que repita toda la batería E2E

### Salida

Solicitar **visto bueno explícito** del dueño (producto) sobre la evidencia ya verde. El **reviewer** ejecuta checklist técnico del skill `pr-reviewer` sobre el PR/diff; puede ser la misma persona que el dueño, pero el rol es distinto de “tester desde cero”.

---

## Fase 6: Done + push + publicar

Solo tras **visto bueno** del dueño (`AGENTS.md` § 1.2).

### Checklist

- [ ] `Estado: done`, mover a `completed/`, `BACKLOG.md`
- [ ] Summaries si aplica
- [ ] Commit, push, deploy según pipeline

### Salida al usuario

**Tras Fase 4 verde (antes del visto bueno):**

```markdown
## Listo para revisión: [STRY-XXX] [Nombre]

- Implementación y validación **agente** completas (UT + Playwright headed + headless).
- Pendiente: **reviewer** (PR) + tu **visto bueno** para merge / `done` / deploy.
```

**Tras Fase 6:**

```markdown
## Story completada: [STRY-XXX] — métricas y comandos de verificación
```

---

## Reglas de Oro del Orquestador

1. **Nunca omitir una fase** del orden 0 → 1 → 2 → 3 → 4.
2. **No pedir permiso entre fases** salvo decisión técnica irresoluble (Principios §3).
3. **Plan completo** (`plan.md`) antes de implementación sustancial.
4. **Bucle Dev↔QA** automático hasta verde o tope de ciclos.
5. **Si un paso falla más de 5 veces dentro de un mismo ciclo estrecho**, escalar a bloqueo documentado.
6. **Sin E2E/Playwright verde en el alcance de la US**, no declarar “validado por agente”.
7. **No `done`/push/deploy sin visto bueno** del dueño (`AGENTS.md`).
8. **Commits** alineados a validación del repo (`npm run validate` o equivalente si existe).

---

## Comandos Rápidos del Orquestador

| Comando                        | Qué hace                                        |
| ------------------------------ | ----------------------------------------------- |
| `Implementa X`                 | Fase 0–6 según protocolo (autónomo entre fases) |
| `valida todo`                  | Pipeline global `AGENTS.md`                     |
| `kilo run story --id STRY-XXX` | Igual que Implementa STRY-XXX                   |

---

_Versión 1.6 | 2026-05-03 — Fases secuenciales, bloque de preguntas inicial, bucle Dev↔QA autónomo, notificación pre–visto bueno._
