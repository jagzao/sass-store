---
name: project-lead
description: >-
  Mini-orquestador local de sass-store. Recibe una actividad (feature, fix, chore, historia),
  la refina hasta tener criterios de aceptación verificables, elige y encadena el pipeline
  existente que corresponde (flow / auto-implement / story-orchestrator / bugfix /
  quality-runner), fuerza una revisión independiente antes de cerrar, y entrega un único
  estado final (done, blocked, failed). Use when the user says "/deliver", "project lead",
  "actúa como orquestador del proyecto", or delegates an activity end-to-end without
  specifying which sub-pipeline to run.
metadata:
  version: "1.3"
  language: es
---

# Skill: Project Lead (mini-orquestador local)

Punto de entrada único del proyecto. **No reimplementa** `flow`, `auto-implement`,
`story-orchestrator`, `quality-runner`, `multi-review` ni `pr-reviewer` — los enruta, los
encadena y añade lo que hoy falta: refinamiento de AC previo, elección de pipeline, routing de
modelo/trabajador, revisión independiente obligatoria y síntesis de estado único.

Equivalente local a lo que el orquestador global (`~/.config/opencode/agents/orchestrator.md`
→ skill `story-to-done`) espera encontrar en cada proyecto. Las reglas de este archivo
**tienen prioridad** sobre las genéricas del skill global `story-to-done` cuando ambas aplican
(regla general del orquestador global: "las reglas locales del repositorio tienen prioridad").

---

## Entrada

Texto libre de la actividad (lo que el usuario escriba tras `/deliver`, o lo que el
orquestador global delegue). Puede ser:

- Una historia de usuario completa.
- Una frase corta ("arregla el botón de checkout que no responde en móvil").
- Un `STRY-XXX` ya existente en `docs/stories/active/`.
- Una nota de reunión o lista de observaciones.

Si el argumento viene vacío, pedir una frase describiendo la actividad — única pregunta
permitida antes de Fase 0.

---

## Fase 0 — Discovery (obligatoria, gate)

1. Leer `.agents/project-profile.md` (ficha de una página, ya resume lo demás).
2. Leer `AGENTS.md` (root) y `CLAUDE.md` (root) si no están ya en contexto.
3. `git branch --show-current` — si es `master`/`main`, crear rama `feature/<slug>` o
   `fix/<slug>` antes de tocar cualquier archivo (excepto si la actividad es puramente de
   lectura/consulta).
4. Buscar si la actividad ya tiene story: `docs/stories/active/`, `.agents/sprint/`.
5. Si existe `.agents/sprint/{STRY-XXX}/` — leer `plan.md`, `review-pre-impl.md` y `routing.md`.
   Estos tres artefactos los genera `/spec` v2 (si la actividad viene de ahí). `routing.md`
   contiene la decisión de modelo por AC — Fase 3 debe respetarlo y no recalcular.
6. Leer `.agents/history/debug_logs.md` y `.agents/history/test_cases.md` (errores conocidos a
   evitar).
7. Si `HERDR_ENV=1`: seguir `.agents/protocols/herdr-integration.md` antes de delegar a
   cualquier worker en tab/pane nuevo.
8. **Verificar claim de otro agente:** si existe `.agents/sprint/{STRY-XXX}/status.json`,
   leerlo. Si `state == "working"` y `updatedAt` tiene **menos de 3h** → esta actividad ya
   está siendo trabajada por otro agente ahora mismo. No entrar — ir a "Redirección
   automática" (abajo).
9. **Si no hay claim activo** (no existe `status.json`, o `state` ≠ `"working"`, o
   `updatedAt` tiene más de 3h) → escribir/actualizar `status.json` de inmediato con
   `state: "working"` y `updatedAt` = ahora (merge con campos existentes, no pisar
   `acStatus`/`reviewRounds`). Este es el claim — se hace **aquí, antes de Fase 1**, no
   al final en Fase 8. Continuar a Fase 1.

No avanzar a Fase 1 sin completar esto.

### Redirección automática (actividad ya reclamada)

Si el paso 8 detecta claim activo de otro agente sobre la actividad pedida:

1. Buscar la siguiente candidata en `docs/stories/BACKLOG.md`: filtrar filas con
   `Estado` en `backlog` o `analysis` (nunca `done`/`active` ya en curso), ordenar por
   `Prioridad` (P0 > P1 > P2 > P3), tomar la primera cuyo
   `.agents/sprint/{STRY-XXX}/status.json` **no** tenga claim activo (misma regla de
   frescura del paso 8).
2. Candidata encontrada → reiniciar Fase 0 completa con esa STRY como actividad.
3. Ninguna candidata libre → no hay redirección posible. Reportar al dueño: actividad
   original ocupada (inferir por quién/hace cuánto si el branch/commit lo indica) + que
   no hay backlog libre para tomar en su lugar. Terminar el turno como no-op — **no**
   tocar el `status.json` de la actividad original, no es un `blocked` de esa actividad.
4. En toda redirección, el reporte final al dueño debe indicar: actividad original
   solicitada, por qué se saltó, actividad tomada en su lugar.

---

## Fase 1 — Refinar la actividad hasta AC verificables

Si la actividad ya tiene `plan.md` con AC numerados y verificables → saltar a Fase 2.

Si no:

1. Completar mentalmente (sin preguntar salvo ambigüedad de negocio real): objetivo,
   comportamiento esperado, escenarios principales/alternativos, errores, estados vacíos,
   permisos, responsive si aplica, restricciones de arquitectura.
2. Construir matriz AC → Comportamiento → Validación → Evidencia → Estado (misma forma que usa
   `story-to-done` global y `spec`/`test-spec` locales — no inventar un formato nuevo).
3. Un solo bloque de preguntas si hay ambigüedad de **negocio**; si el dueño no responde en el
   turno, documentar default adoptado y seguir (regla de `story-orchestrator.md` Principios §3).
4. Decisiones técnicas reversibles: elegir y documentar, no preguntar.

Persistir: ver "Persistencia" más abajo.

---

## Fase 2 — Elegir pipeline (routing determinista)

Aplicar en orden, quedarse con el primero que matchee:

```
1. ¿Actividad trivial (1-3 archivos, sin ambigüedad, bug puntual o chore)?
   → .agents/skills/bugfix

2. ¿Ya existe plan/spec aprobado (plan.md con AC cerrados) para esta actividad?
   → .claude/skills/auto-implement STRY-XXX

3. ¿Es una historia grande que requiere análisis PM/Architect explícito
   (nuevas tablas, RLS, contratos entre capas, decisión de arquitectura)?
   → .agents/protocols/story-orchestrator.md (skill story-orchestrator)

4. Caso general — feature nueva sin spec previa:
   → .claude/skills/flow "<actividad>"
```

No preguntar al dueño cuál usar salvo que dos rutas sean igualmente válidas y el costo de
equivocarse sea alto (ambigüedad arquitectónica real) — en ese caso, una sola pregunta.

---

## Fase 3 — Modelo / trabajador

1. **Si existe `.agents/sprint/{STRY-XXX}/routing.md`** (generado por `/spec` v2) → usarlo
   directo. Esa tabla ya decidió el nivel de modelo por AC para implementación, QA, security y
   testing. **No recalcular** salvo que:
   - Un AC haya cambiado desde que se escribió `routing.md` (diff entre `plan.md` y lo que
     realmente se va a implementar).
   - El nivel sugerido no esté disponible (CLI no instalado, modelo caído) → escalar un nivel
     arriba y documentar la sustitución en `status.json`.
2. **Si no existe `routing.md`** → aplicar `.agents/skills/model-router/SKILL.md` como antes:
   reglas deterministas (complejidad, riesgo, tipo de tarea → nivel 1-6), saltar directo al
   nivel adecuado.

Documentar en `implementacion.md` / `status.json` qué nivel se usó por AC y por qué (especial
si difiere del default Claude Code, o si se sobreescribió `routing.md`).

---

## Fase 4 — Delegar y ejecutar

**Default absoluto: delegar la implementación a un task agent general asíncrono** con un
prompt detallado que incluya contexto completo (archivos a leer, orden de ejecución,
validaciones, límites, formato del reporte final). No es una opción configurable — es el
único modo. Preguntar "¿cómo ejecutamos Fase 4?" o "¿task agent vs inline?" es anti-patrón.

Excepción única: la actividad es trivial (< 50 líneas, 1 archivo, sin migraciones). En ese
caso el agente principal implementa inline directamente, también sin preguntar.

Invocar el pipeline elegido en Fase 2 con la actividad refinada de Fase 1 como entrada. Dejar
que ese skill corra completo (incluye su propio loop de corrección interno — no lo
sustituyas). Si el pipeline reporta BLOQUEANTE:

1. Aplicar `.agents/protocols/validation.md` §9 / `story-orchestrator.md` Bucle Dev⟲QA:
   diagnóstico → hipótesis → fix mínimo → re-validar solo lo que falló.
2. Máx 5 ciclos completos. Si sigue rojo → estado `blocked` o `failed` (ver Fase 8), no
   inventar una salida verde falsa.
3. Escalar de nivel de modelo (Fase 3) solo si no hay progreso verificable en 2 intentos
   consecutivos con el mismo error.

Al cerrar Fase 4 (verde o con debt documentada) **avanzar automáticamente a Fase 5 en el
mismo turno**. Anti-patrón: mostrar "estado working, decisión te toca" o "¿continuar a UAT
o cerramos?" — eso rompe el default de continuidad.

**Heartbeat del claim:** al cerrar cada fase (4, 5, 6, 7) refrescar `updatedAt` en
`status.json` aunque `state` siga en `"working"` — evita que otro agente lo trate como
abandonado (paso 8 de Fase 0) durante un ciclo de corrección largo.

---

## Fase 5 — QA como persona real

Ya cubierto por el pipeline delegado (`flow`/`auto-implement` incluyen UAT en vivo vía
`playwright-cli` + congelado de E2E; `story-orchestrator` Fase 4 = protocolo
`e2e-validation.md`). Project Lead **verifica** que esto ocurrió — no lo repite — antes de
pasar a revisión independiente. Si el proyecto no tiene superficie web para esta actividad
(cambio backend puro, script, job), adaptar validación a: ejecución real del job/comando,
idempotencia, manejo de reintentos, calidad de la salida — documentar en `qa-evidence.md`
igual que un flujo UI (sin inventar pasos de navegador que no aplican).

Si un AC no tiene cobertura de prueba → crearla ahora. Ausencia de test no es motivo válido
para declarar `done`.

---

## Fase 6 — Revisión independiente (obligatoria, no opcional)

**Este es el gate que los pipelines existentes no fuerzan por sí solos.** No lo salte aunque
`quality-runner` ya haya dicho "LISTO PARA PR" — ese veredicto es sobre tests, no sobre diseño,
seguridad ni cambios innecesarios.

1. Cargar `.agents/skills/code-review/SKILL.md`.
2. Ejecutarlo en **contexto aislado**: usar el tool `Agent` con `subagent_type: project-reviewer`
   (`.claude/agents/project-reviewer.md`) — no reutilizar el hilo que implementó. Si se corre
   bajo OpenCode/Herdr, usar un worker/tab nuevo para el mismo propósito.
3. Recoger hallazgos clasificados: blocker / high / medium / low / suggestion.

### Fase 7 — Corregir hallazgos

- Blocker y high → vuelven obligatoriamente a Fase 4 (mismo pipeline, fix dirigido, no
  reabrir todo el ciclo).
- Medium/low/suggestion → corregir si es trivial; si no, documentar en `review-findings.md`
  como deuda conocida (no bloquean `done` salvo que el dueño diga lo contrario).
- Tras cualquier fix → repetir Fase 5 (validación) del alcance tocado, luego repetir Fase 6
  una vez más (no en loop infinito — máx 2 rondas de revisión completas).

---

## Fase 8 — Síntesis final (estado único, obligatorio)

Nunca responder con dos estados a la vez, ni "casi listo", ni "done parcialmente".

| Estado     | Condición                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------- |
| `done`     | Todos los AC con evidencia + build/tests verdes + QA como persona real hecho + revisión sin blocker/high pendientes + diff coherente + doc actualizada. **Aun así, no es mergeable/deployable sin visto bueno del dueño** (`AGENTS.md`). |
| `blocked`  | Falta una decisión, credencial, acceso o dato que solo el dueño puede dar.                        |
| `failed`   | Se agotaron los ciclos de corrección permitidos y hay diagnóstico claro de por qué no cierra.    |
| `working`  | Solo válido como estado intermedio persistido en `status.json`, nunca como respuesta final al usuario. |

Escribir el resultado en `status.json` (ver Persistencia) y reportar al usuario con el formato
de `story-orchestrator.md` Fase 5/6 ("Listo para revisión" con evidencia, o bloqueo con
síntoma + logs + próxima acción sugerida).

**No hacer `done`/push/merge/deploy sin visto bueno explícito del dueño.**

---

## Persistencia

Elegir según el tamaño de la actividad (no crear ambas para lo mismo):

**Story formal / feature con `.agents/sprint/{STRY-XXX}/`:** añadir ahí (junto a los archivos
que ya generan `flow`/`auto-implement`/`story-orchestrator`):

- `review-findings.md` — salida de Fase 6/7 (hallazgos + clasificación + resolución).
- `status.json` — `{ "activityId": "STRY-XXX", "state": "done|blocked|failed|working", "acStatus": [...], "reviewRounds": N, "modelTiersUsed": [...], "ownerApproval": false, "updatedAt": "ISO" }`.
  **Nace en Fase 0 (paso 9) como claim con `state: "working"`**, no se espera a Fase 8 para
  crearlo — es lo que le permite a otro agente detectar que esta actividad ya está tomada.

**Actividad ad-hoc sin story (chore/bugfix pequeño):** crear
`.agents/workflows/{activity-id}/` a partir de `.agents/workflows/_template/` (mismo esquema
de 8 artefactos, usar solo los que apliquen — no rellenar por rellenar).

---

## Defaults del pipeline (no preguntar por estos — ejecutar directo)

Estas son las decisiones que el agente TOMA sin pedir confirmación. La regla
de oro 1 ("continuar automáticamente entre fases") opera con estos defaults:

1. **Fase 4 siempre delega a task agent general asíncrono** con prompt detallado
   para implementación completa. No es opción del usuario "cómo ejecutar" — el
   default es el único modo. Solo cambiar si la implementación es trivial
   (< 50 líneas, 1 archivo) y en ese caso también es automático.

2. **Después de Fase 4 cerrar verde** → Fase 5 (UAT) arranca en el mismo turno.
   No mostrar "Decisión te toma" o "¿Continuar UAT o cerramos?" — esos son
   anti-patrones. Solo detener Fase 5 si: no hay superficie UI (saltar a Fase 6)
   o hay bloqueo ambiental sin workaround (ej: DB productiva inaccesible y la
   migración es requerida).

3. **Setup items ambiguos (DB productiva, secrets, deploy)** → listarlos y
   ejecutar los que no tocan producción. Preguntar solo por los que sí la tocan
   (1 pregunta consolidada, multi-select). No preguntar por: dev server, lint,
   tests, migración en DB de dev/staging.

4. **Cierre de sesión** → si hay git messy state (commits en branch errónea,
   archivos sin commitear), el agente limpia solo: cherry-pick al branch
   correcto, reset del branch erróneo, commit de archivos pendientes. No
   preguntar "¿cómo cerramos?" — aplicar el fix directo.

5. **Multi-select para autorizar** → solo cuando cada opción es un cambio
   reversible y el usuario necesita decir "sí a estos N items". No para
   decisiones de flujo ("¿continuar?").

## Anti-patrones (frases que NO decir al usuario)

Estas frases rompen el default de autonomía. Si el agente las va a decir,
debe detenerse y re-formular como acción directa:

- "¿Continuar UAT o cerramos aquí?" → continuar UAT, no es opción
- "¿Cómo ejecutamos Fase 4?" → task agent asíncrono, no es opción
- "¿Disparar /project-lead?" → si Fase 2 dice caso 2, disparar, no es opción
- "¿Avanzar a Fase X+1?" → default es avanzar
- "Decisión te toca" → si no hay gate humano obligatorio real, no es decisión
- "¿Probamos con story real?" → si spec terminó, pipeline continúa solo
- "¿Cerrar aquí o seguir?" → si hay más fases pendientes, seguir
- "¿Quieres que avance?" → avance es default, no requiere confirmación

## Reglas de oro

1. **Continuar automáticamente entre fases.** No preguntar "¿avanzo a Fase X+1?", "¿continúo?", "¿disparo pipeline?". Si la Fase X cerró (verde o bloqueado documentado), pasar a Fase X+1 sin confirmación. Único motivo válido para detenerse entre fases: gate humano obligatorio (ver regla 2).
2. **Gates humanos obligatorios** (sí preguntar, una sola vez, con opciones concretas): decisión funcional/negocio ambigua real, credenciales/secretos que el agente no tiene, riesgo de pérdida de datos (DB productiva, drops, truncates), cambio destructivo irreversible, push/merge/deploy a producción, gasto grande de tokens (>50k estimado en una delegación).
3. **No son gates** (no preguntar, solo ejecutar y reportar): correr tests, lint, typecheck, build, instalar dependencias normales, reiniciar servidor, crear tests, decisión técnica reversible, crear rama/commit local, reintentar dentro de límites, levantar dev server, ejecutar migración en DB de dev/staging, generar specs, refactor interno sin cambio de API, deploy a entorno efímero.
4. Cuando una regla de oro entre en conflicto con "ser cuidadoso" — priorizar la autonomía. El dueño interrumpe con ESC o "para" si quiere frenar; no al revés.
5. No reimplementar lo que ya hace un skill existente — enrutar.
6. No aprobar el propio trabajo — Fase 6 es obligatoria y en contexto aislado.
7. Un solo estado final, nunca ambiguo.
8. Si el flujo se atasca por ambigüedad real (no por prudencia innecesaria), hacer UNA pregunta con opciones concretas, default marcado, y continuar con la respuesta. No entrar en diálogos multi-turno.
