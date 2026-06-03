# Ejemplos — spec-discovery

## Ejemplo 1 — Entrada del dueño (Fase 1)

**Dueño:**

> Como maestro de tenis quiero ver las clases del día con mis alumnos y marcar quién vino. También quiero crear clases donde se puedan anotar varios alumnos.

**Agente (extracto):**

Entendido: módulo de clases grupales con roster, asistencia por alumno y CRUD de sesiones para tenants deportivos.

## Asunciones para tu revisión

| #   | Asunción                                            | Impacto              |
| --- | --------------------------------------------------- | -------------------- |
| 1   | Solo tenants deportivos (slug tenis/tenistico)      | Alcance multitenancy |
| 2   | Asistencia binaria: presente / ausente              | CA-2, UI home        |
| 3   | Inscripción pública sin login; teléfono obligatorio | CA inscripción       |
| 4   | Convive con reservas 1:1 existentes; sin migración  | Alcance MVP          |
| 5   | Recordatorio WhatsApp 24h antes vía cola existente  | Notificaciones       |

Revisá el listado. Respondé con los números que no te gustan.

---

## Ejemplo 2 — Dueño rechaza asunciones (Fase 3)

**Dueño:** `2, 3`

**Agente — Pregunta 1 de 2:**

---

**Pregunta 1 de 2** — Asunción #2 rechazada

¿Cómo debe funcionar el registro de asistencia cuando un alumno llega tarde o falta justificada?

**Progreso:** [1/2] `█████░░░░░` 50%

| Opción       | Descripción                                           |
| ------------ | ----------------------------------------------------- |
| **1**        | Binario: solo presente o ausente                      |
| **2**        | Tres estados: presente, ausente, tarde                |
| **3**        | Cuatro estados: presente, ausente, tarde, justificado |
| **4**        | Binario en MVP; estados avanzados en fase 2           |
| **5 — Otra** | Ninguna de las anteriores; especificá tu respuesta    |

## Respondé con el número de opción (1–5).

**Dueño:** `4`

**Agente (1 línea + siguiente pregunta):**

Registrado: binario en MVP; estados avanzados fuera de MVP.

---

**Pregunta 2 de 2** — Asunción #3 rechazada

## ...

## Ejemplo 3 — Cierre (Fase 4)

**Agente:**

| #   | Asunción                                 | Estado |
| --- | ---------------------------------------- | ------ |
| 1   | Solo tenants deportivos                  | ✅     |
| 2   | Asistencia binaria en MVP                | ✅     |
| 3   | Inscripción con login de alumno opcional | ✅     |
| ... | ...                                      | ✅     |

**Cambios vs borrador inicial:**

- Asunción #2: estados avanzados movidos a fuera de MVP.
- Asunción #3: login opcional para alumnos recurrentes.

> **Ya me encuentro listo para crear la especificación.**

¿Creo el archivo en `.specs/sesiones-deportivas-v2.md` con el borrador completo?
