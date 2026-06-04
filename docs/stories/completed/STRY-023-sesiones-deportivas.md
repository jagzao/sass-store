# Story: STRY-023 — Sesiones deportivas (clases grupales, inscripción y asistencia)

> **ID:** STRY-023  
> **Estado:** done  
> **Prioridad:** P1  
> **Sprint:** S2  
> **Asignado:** PM → Architect → Dev → QA  
> **Creado:** 2026-06-02  
> **Actualizado:** 2026-06-03  
> **Spec canónica:** [`.specs/sesiones_deportivas.md`](../../.specs/sesiones_deportivas.md)

**Artefactos de sprint:** `.agents/sprint/STRY-023-sesiones-deportivas/` con `plan.md`, `implementacion.md`, `testing-usuario.md`.

---

## 1. Narrativa

Como **admin/maestro de un tenant deportivo (tenis)**, quiero **ver en mi home las sesiones del día con todos los alumnos inscritos y marcar asistencia individual**, y **gestionar desde una pantalla dedicada la creación, edición y eliminación de clases/eventos a los que múltiples alumnos puedan anotarse**, para **operar clases grupales con cupo, enviar recordatorios automáticos por WhatsApp/email (n8n) y preparar esos eventos para redes sociales**.

### Contexto

- Los tenants deportivos (p. ej. `centro-tenistico`) hoy usan el modelo de citas 1:1 (`bookings`) heredado de salones de belleza.
- **Diferenciador clave:** en tenis, **una sesión admite N alumnos**; en wondernails, **1 clienta por slot**.
- No existen tablas `class_sessions`, roster ni asistencia; la spec técnica está en `.specs/sesiones_deportivas.md`.
- Notificaciones: reutilizar cola `scheduled_notifications` + n8n (recordatorio 24h antes, patrón `booking-reminder-notification.ts`).

---

## 2. Criterios de Aceptación (Gherkin)

### CA-1: Home — sesiones con roster (Happy path)

```gherkin
Dado que soy maestro autenticado en un tenant deportivo
Cuando abro el home operativo del admin
Entonces veo las sesiones programadas para hoy con hora, instructor y cupo (ej. "3/8")
Y al expandir una sesión veo la lista completa de alumnos inscritos
```

### CA-2: Asistencia — palomita por alumno (Happy path)

```gherkin
Dado que una sesión tiene alumnos inscritos
Cuando marco la palomita de asistencia de un alumno
Entonces el estado presente/ausente se persiste al recargar
Y puedo cambiar la palomita hasta el cierre del día de la sesión
```

### CA-3: CRUD sesiones (Happy path)

```gherkin
Dado que accedo a "/t/{tenant}/admin/sessions"
Cuando creo una sesión con título, fecha, hora, cupo, instructor y descripción
Entonces la sesión queda visible en admin y disponible para inscripción pública
Y puedo editarla y eliminarla según las reglas de la spec
```

### CA-4: Inscripción pública multi-alumno (Happy path)

```gherkin
Dado que un visitante accede a "/t/{tenant}/sessions"
Cuando se anota a una sesión con cupo disponible (nombre y teléfono)
Entonces aparece en el roster del maestro en el home
Y si el teléfono es válido se encola recordatorio 24h en scheduled_notifications
```

### CA-5: Cupo lleno e inscripción duplicada (Sad path)

```gherkin
Dado que una sesión tiene el cupo completo
Cuando un alumno intenta anotarse
Entonces ve mensaje de cupo agotado y no hay overbooking

Dado que un alumno ya está inscrito
Cuando intenta anotarse de nuevo con el mismo teléfono
Entonces el sistema rechaza con mensaje amigable
```

### CA-6: Permisos y multitenancy (Sad path)

```gherkin
Dado que un usuario sin rol staff intenta CRUD o asistencia
Entonces recibe 403 sin datos de otro tenant

Dado que consulto una sesión de otro tenant por ID
Entonces recibo NotFound o 403
```

### CA-7: Notificaciones n8n (Happy path)

```gherkin
Dado que un alumno se inscribe con teléfono válido
Cuando se confirma la inscripción
Entonces existe fila pending en scheduled_notifications con template_key session_reminder_24h
Y scheduled_at es 24 horas antes del inicio de la sesión

Dado que reprogramo o cancelo la sesión
Cuando guardo el cambio
Entonces los recordatorios pending asociados pasan a cancelled o se re-encolan
```

---

## 3. Mockups / Wireframes

- [ ] Wireframe local: derivar de cards en `HomeTenant` + listado admin existente
- [x] Spec UI: `.specs/sesiones_deportivas.md` §10

---

## 4. Contrato Técnico (API)

Ver spec §8. Resumen:

```
GET/POST   /api/tenants/{tenant}/sessions
GET/PATCH/DELETE /api/tenants/{tenant}/sessions/{id}
GET/POST   /api/tenants/{tenant}/sessions/{id}/enrollments
PATCH      /api/tenants/{tenant}/sessions/{id}/attendance
```

### DomainError Variants

- `ValidationError` — datos inválidos, cupo superado
- `NotFoundError` — sesión/enrollment inexistente
- `ConflictError` — cupo lleno, inscripción duplicada
- `ForbiddenError` — sin permisos
- `DatabaseError` — fallo de persistencia

---

## 5. Impacto Multitenancy

- [x] Nuevas tablas: `class_sessions`, `session_enrollments`, `session_attendance` con `tenant_id`
- [x] Nuevas RLS policies por `tenant_id`
- [ ] Modifica queries existentes de bookings (no en MVP — conviven)
- [x] **Tenant de prueba E2E:** `centro-tenistico`
- [x] Feature solo para tenants deportivos (heurística slug + helper `isSportsTenant`)

---

## 6. Plan de Implementación

Detalle operativo: `.agents/sprint/STRY-023-sesiones-deportivas/plan.md`

### Fase 1: DB + Servicios + UT

- Migración + Drizzle schema + RLS
- `ClassSessionService`, `SessionEnrollmentService`, `SessionAttendanceService`
- `SessionReminderNotification` (encolado n8n)

### Fase 2: API Routes

- Rutas bajo `/api/tenants/[tenant]/sessions/**` con `withResultHandler`

### Fase 3: UI

- Home extendido (sesiones + roster + asistencia)
- `/admin/sessions` CRUD
- `/sessions` inscripción pública

### Fase 4: QA

- `testing-usuario.md` + `tests/e2e/sesiones-deportivas.spec.ts`

---

## 7. Checklist de Calidad

- [x] Tests unitarios (smoke + reminder schedule; `class-session-service.spec.ts`)
- [x] Tests E2E `--grep "sesiones-deportivas"` — **4/4** (2026-06-03)
- [x] Result Pattern en lógica nueva
- [x] `tenant_id` en todas las queries + RLS
- [x] `npx tsc --noEmit` en `apps/web` verde
- [x] `npm run build` — fix SSG: `tenant-static-params` + checkout `force-dynamic` (2026-06-03)
- [x] Migración `0018_class_sessions` aplicada (`npm run db:migrate:class-sessions`)
- [x] Visto bueno del dueño — ver § 10

---

## 8. Métricas de Éxito

| Métrica                                | Target               | Actual                                   |
| -------------------------------------- | -------------------- | ---------------------------------------- |
| Sesiones con roster multi-alumno       | 100% en CTV          | ✅ Implementado                          |
| Recordatorio 24h encolado al inscribir | Sí, con teléfono     | ✅ `session_reminder_24h`                |
| Tests E2E STRY-023                     | 4 escenarios mínimos | ✅ **4/4**                               |
| Cobertura servicios nuevos             | ≥80%                 | ⏳ Subset UT (4 tests); ampliar en deuda |

---

## 10. Visto bueno del dueño de producto

| Campo                  | Valor                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| **Fecha**              | 2026-06-03                                                                                            |
| **Aprobado por**       | Dueño de producto (mensaje: «ambos» — documentar visto bueno + build)                                 |
| **Alcance aprobado**   | Spec `.specs/sesiones_deportivas.md`, implementación STRY-023, landing CTV, E2E 4/4                   |
| **Evidencia agente**   | `npm run test:e2e:subset -- --grep "sesiones-deportivas"` (BASE_URL 3003); UT 4/4; migración aplicada |
| **Build (2026-06-03)** | ✅ Verde tras filtrar tenants E2E en `generateStaticParams` y checkout dinámico                       |
| **Pendiente release**  | commit/PR/merge según pipeline del equipo                                                             |

---

## 9. Notas y Riesgos

| Riesgo                                  | Mitigación                                                                       |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| Race condition en cupo                  | Transacción + constraint UNIQUE + validación en servicio                         |
| Convivencia con `/book` 1:1             | No migrar bookings; documentar en admin                                          |
| n8n sin plantillas sesión               | Defaults en `notification-template.ts` + doc en `n8n-scheduled-notifications.md` |
| Home CTV muestra landing, no HomeTenant | Enlace explícito a `/admin` y sesiones                                           |

**Relación STRY-006:** Notificaciones push/WhatsApp en backlog; esta US implementa el subconjunto **sesiones deportivas** vía cola existente.

---

**Orquestador:** `Implementa STRY-023` → ver `.agents/protocols/story-orchestrator.md` y `.agents/sprint/STRY-023-sesiones-deportivas/plan.md`.
