---
name: spec-discovery
description: >-
  Descubre y valida especificaciones funcionales a partir de una historia de usuario.
  Rellena una spec con asunciones, lista las no técnicas/funcionales para revisión del
  dueño, y resuelve discrepancias con preguntas una a una (4 opciones + Otra, barra de
  progreso). Use when the user says "define spec", "crea spec", "especificación",
  "historia de usuario para spec", or wants to fill blanks before writing `.specs/*.md`.
---

# Spec discovery (sass-store)

Workflow conversacional para pasar de **historia de usuario** → **spec validada** antes de escribir el archivo final en `.specs/`.

**Plantilla canónica:** leer [spec-template.md](spec-template.md) al iniciar Fase 1.

**Referencia de calidad:** `.specs/sesiones_deportivas.md` (spec aprobada de ejemplo).

**No iniciar implementación** ni crear User Story en `docs/stories/` hasta que el dueño confirme que la spec está lista (Fase 4).

---

## Reglas globales (obligatorias)

1. **Una pregunta por turno** en Fase 3 — nunca agrupar dos asunciones rechazadas en el mismo mensaje.
2. **Barra de progreso** en cada pregunta de Fase 3 (formato abajo).
3. **Cuatro opciones numeradas + quinta "Otra"** en cada pregunta de Fase 3.
4. El listado de asunciones (Fase 2) incluye **solo asunciones no técnicas o funcionales** (UX, alcance, roles, permisos, reglas de negocio visibles, terminología, multitenancy de producto). Las decisiones puramente técnicas (stack, Result Pattern, nombres de tablas) se documentan en la spec pero **no** entran al listado de revisión.
5. Marcar en la spec los campos rellenados por asunción con `<!-- ASUNCION: N -->` hasta validarlos en Fase 3.
6. Responder en español salvo que el dueño pida otro idioma.

---

## Fase 1 — Borrador con espacios rellenados

**Entrada:** historia de usuario del dueño (puede ser texto libre, narrativa Gherkin incompleta, o bullet points).

**Acciones:**

1. Leer [spec-template.md](spec-template.md).
2. Generar borrador completo rellenando **todos** los espacios en blanco.
3. Donde falte información, **asumir** y anotar cada asunción (numerada, globalmente).
4. Separar mentalmente:
   - **Asunciones funcionales/no técnicas** → irán al listado de Fase 2.
   - **Asunciones técnicas** → van directo al borrador (secciones API, modelo, testing, Result Pattern).

**Salida del turno (Fase 1):**

- Resumen breve (2–4 líneas) de lo entendido.
- Borrador de spec **colapsado o resumido** (no volcar las 17 secciones completas; mostrar narrativa + CA principales + tabla de asunciones pendientes).
- Invitar al dueño: _"Revisá el listado de asunciones. Respondé con los números que no te gustan (ej. `2, 5, 9`). Si todo está bien, decí `ok` o `ninguna`."_

**No** pasar a Fase 3 hasta recibir la respuesta del dueño.

---

## Fase 2 — Listado de asunciones para revisión

Mostrar **solo** asunciones no técnicas / funcionales en esta forma:

```markdown
## Asunciones para tu revisión

| #   | Asunción                         | Impacto en la spec |
| --- | -------------------------------- | ------------------ |
| 1   | {texto claro, sin jerga técnica} | {sección afectada} |
| 2   | ...                              | ...                |

**Instrucciones:** indicá los números que querés cambiar. Ejemplo: `3, 7`
```

**Clasificación guía** (qué SÍ listar):

| Incluir en listado                               | Excluir del listado                                            |
| ------------------------------------------------ | -------------------------------------------------------------- |
| Alcance MVP vs futuro                            | Result Pattern, Zod, nombres SQL                               |
| Roles y permisos de producto                     | Rutas API exactas (salvo que el dueño deba elegir URL pública) |
| Reglas de negocio visibles al usuario            | Índices, RLS (salvo decisión de producto)                      |
| Terminología (Alumno vs Clienta)                 | Stack n8n vs otro                                              |
| Comportamiento UX (mobile-first, confirmaciones) | Estructura de carpetas del repo                                |
| Tenant piloto, multitenancy de producto          | Tags E2E, credenciales de prueba                               |

Si el dueño responde `ok`, `ninguna`, `todas bien` o equivalente → **saltar Fase 3** e ir directo a Fase 4.

---

## Fase 3 — Preguntas una a una (asunciones rechazadas)

**Entrada:** números rechazados por el dueño (ej. `2, 5, 9`).

**Orden:** una pregunta por número, en el orden numérico ascendente.

**Formato obligatorio de cada pregunta:**

```markdown
---
**Pregunta {actual} de {total}** — Asunción #{n} rechazada

{Enunciado claro de la decisión que el dueño debe tomar, en lenguaje de producto}

**Progreso:** [{actual}/{total}] `{barra}` {porcentaje}%

| Opción | Descripción |
|--------|-------------|
| **1** | {asunción alternativa A — concreta} |
| **2** | {asunción alternativa B — concreta} |
| **3** | {asunción alternativa C — concreta} |
| **4** | {asunción alternativa D — concreta} |
| **5 — Otra** | Ninguna de las anteriores; especificá tu respuesta |

Respondé con el número de opción (1–5). Si elegís **5**, escribí tu definición.
---
```

**Barra de progreso:** usar bloques de 10. Ejemplo para pregunta 2 de 5:

`[2/5]` `████░░░░░░` 40%

**Generación de las 4 opciones:**

- Opción **1**: la asunción original (para que el dueño pueda reconsiderarla).
- Opciones **2–4**: alternativas **plausibles y distintas**, no variaciones triviales.
- Opción **5**: siempre literal **"Otra"**.

**Tras cada respuesta del dueño:**

1. Registrar la decisión definitiva (reemplaza la asunción #n).
2. Actualizar el borrador interno de la spec en las secciones afectadas.
3. Si quedan preguntas → **siguiente mensaje = siguiente pregunta únicamente** (no resumir las anteriores salvo 1 línea de confirmación: _"Registrado: {decisión}. Siguiente:"_).

**Si el dueño elige 5 (Otra):** aceptar su texto como verdad; no re-preguntar salvo ambigüedad grave.

---

## Fase 4 — Listo para crear la spec

Cuando **todas** las asunciones rechazadas estén resueltas (o no hubo rechazos):

1. Mostrar tabla **Asunciones validadas** (todas las funcionales/no técnicas, estado ✅).
2. Resumen de cambios respecto al borrador inicial (bullet points).
3. Cerrar con esta frase **exacta**:

> **Ya me encuentro listo para crear la especificación.**

4. Preguntar: _"¿Creo el archivo en `.specs/{nombre-slug}.md` con el borrador completo?"_

**Solo tras confirmación explícita** (`sí`, `creala`, `adelante`):

- Escribir `.specs/{nombre-slug}.md` siguiendo [spec-template.md](spec-template.md).
- Incluir sección **15. Asunciones validadas** con la tabla final.
- Eliminar comentarios `<!-- ASUNCION: N -->` del documento publicado.

**Encadenamiento opcional:** si el dueño pide implementar después → handoff a skill **`story-orchestrator`** (crear US en `docs/stories/active/` desde la spec).

---

## Triggers y anti-patterns

**Usar este skill cuando:**

- El dueño entrega una HU y pide definir spec antes de codear.
- Hay ambigüedad de producto y se necesita ciclo de asunciones → preguntas.

**No usar cuando:**

- La spec ya existe y está aprobada (`.specs/*.md` con estado Aprobada).
- Solo se pide implementar (`Implementa X`) → usar **`story-orchestrator`**.
- Solo revisión de PR → usar **`pr-reviewer`**.

---

## Ejemplo mínimo de interacción

Ver [examples.md](examples.md).
