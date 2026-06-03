# Spec — Sesiones deportivas (clases grupales con inscripción y asistencia)

> **Estado:** Aprobada  
> **User Story:** STRY-023 — `docs/stories/active/STRY-023-sesiones-deportivas.md`  
> **Sprint:** `.agents/sprint/STRY-023-sesiones-deportivas/`  
> **Alcance tenant:** Deportivos (tenis) — p. ej. `centro-tenistico`  
> **Tenant piloto:** `centro-tenistico`  
> **Creado:** 2026-06-02  
> **Diferenciador vs wondernails:** Una sesión/clase admite **múltiples alumnos** inscritos (roster), no reservas 1:1.

---

## 1. Narrativa

**Como** admin/maestro de un tenant deportivo, **quiero** ver en mi home las sesiones del día con todos los alumnos inscritos y marcar asistencia individual, **y** gestionar desde una pantalla dedicada la creación, edición y eliminación de clases/eventos a los que múltiples alumnos puedan anotarse, **para** operar clases grupales con cupo, enviar recordatorios automáticos y preparar esos eventos para redes sociales.

### Contexto

Hoy los tenants deportivos reutilizan el modelo de citas 1:1 (`bookings`) heredado de salones de belleza. En tenis, una **clase grupal** requiere:

- Una instancia de sesión con **cupo N**
- **Varios alumnos** inscritos en la misma sesión
- **Asistencia por alumno** (palomita)
- **CRUD** de sesiones por el maestro
- **Recordatorios** WhatsApp/email vía cola `scheduled_notifications` + n8n (24h antes, patrón existente)

---

## 2. Diferenciador multitenancy

| Aspecto                   | Wondernails / belleza | Tenant deportivo (tenis)                                                         |
| ------------------------- | --------------------- | -------------------------------------------------------------------------------- |
| Unidad operativa          | Cita 1:1              | Sesión/clase grupal                                                              |
| Alumnos/clientas por slot | 1                     | **0..N** (hasta `max_capacity`)                                                  |
| Modelo actual             | `bookings`            | **`class_sessions` + `session_enrollments` + `session_attendance`**              |
| Home staff                | Citas pendientes      | Sesiones del día + roster + asistencia                                           |
| Detección tenant          | `mode = booking`      | Heurística slug deportivo (`tenistico`, `tenis`, etc.) + feature flag por tenant |

**Convivencia:** El flujo `/book` 1:1 existente **no se migra** en MVP; convive con el nuevo módulo de sesiones grupales.

---

## 3. Criterios de aceptación (Gherkin)

### CA-1: Home — ver sesiones con roster (Happy path)

```gherkin
Dado que soy maestro autenticado en un tenant deportivo
Cuando abro el home operativo (admin / HomeTenant)
Entonces veo las sesiones programadas para hoy (o rango cercano)
Y cada sesión muestra título, hora, instructor, cupo (ej. "3/8") y estado
Y al expandir una sesión veo la lista completa de alumnos inscritos
```

### CA-2: Asistencia — palomita por alumno (Happy path)

```gherkin
Dado que una sesión tiene alumnos inscritos
Cuando marco la palomita de asistencia de un alumno
Entonces el estado presente/ausente se persiste
Y al recargar la página el estado se mantiene
Y puedo cambiar la palomita hasta el cierre del día de la sesión
```

### CA-3: CRUD sesiones — crear clase (Happy path)

```gherkin
Dado que accedo a la pantalla "Sesiones / Clases" del admin
Cuando creo una sesión con título, fecha, hora, duración, cupo, instructor y descripción
Entonces la sesión queda visible en el listado admin
Y queda disponible para inscripción pública
```

### CA-4: Inscripción pública multi-alumno (Happy path)

```gherkin
Dado que un alumno visita la web pública del tenant deportivo
Cuando se anota a una sesión con cupo disponible
Entonces se crea su inscripción en el roster de esa sesión
Y el contador de cupo se incrementa
Y el maestro ve al alumno en el home de esa sesión
Y si hay teléfono válido se encola recordatorio 24h antes vía scheduled_notifications
```

### CA-5: Editar y eliminar sesiones (Happy path)

```gherkin
Dado que existe una sesión creada por el maestro
Cuando edito hora, cupo o descripción
Entonces los cambios se reflejan en admin y en inscripción pública
Y los recordatorios pending se cancelan y re-encolan con el nuevo horario

Dado que elimino una sesión sin inscritos
Entonces desaparece del listado y de inscripción pública

Dado que elimino una sesión con inscritos
Entonces debo confirmar la acción
Y se cancelan inscripciones y recordatorios pending asociados
```

### CA-6: Cupo lleno (Sad path)

```gherkin
Dado que una sesión tiene el cupo completo
Cuando un alumno intenta anotarse
Entonces ve un mensaje claro de cupo agotado
Y no se crea inscripción duplicada ni overbooking
```

### CA-7: Inscripción duplicada (Sad path)

```gherkin
Dado que un alumno ya está inscrito en una sesión
Cuando intenta anotarse de nuevo (mismo teléfono/customer)
Entonces el sistema rechaza la inscripción
Y muestra mensaje amigable (ya inscrito)
```

### CA-8: Permisos y multitenancy (Sad path)

```gherkin
Dado que un usuario sin rol admin/staff intenta acceder al CRUD o marcar asistencia
Entonces recibe 403 o redirect sin filtración de datos

Dado que intento acceder a una sesión de otro tenant
Entonces recibo NotFound o 403
```

### CA-9: Fallo al guardar asistencia (Sad path)

```gherkin
Dado que marco asistencia con red inestable
Cuando falla el guardado
Entonces veo feedback de error
Y puedo reintentar sin pérdida silenciosa de estado
```

### CA-10: Recordatorio 24h — sin teléfono (Sad path)

```gherkin
Dado que un alumno se inscribe sin teléfono válido
Cuando se completa la inscripción
Entonces la inscripción se crea correctamente
Y no se encola recordatorio WhatsApp (log interno opcional)
```

---

## 4. Happy path — matriz resumida

| ID    | Escenario                                                                      |
| ----- | ------------------------------------------------------------------------------ |
| HP-01 | Maestro ve sesiones de hoy en home con cupo e instructor                       |
| HP-02 | Expande sesión → roster completo de alumnos                                    |
| HP-03 | Marca ✅ presente por alumno → persiste                                        |
| HP-04 | Crea sesión en pantalla CRUD → visible en admin y público                      |
| HP-05 | Alumno se anota → aparece en roster del maestro                                |
| HP-06 | Edita sesión → cambios reflejados; recordatorios reprogramados                 |
| HP-07 | Elimina sesión sin inscritos → desaparece                                      |
| HP-08 | Tres alumnos inscritos → los 3 en la **misma** sesión (no 3 bookings)          |
| HP-09 | Inscripción con teléfono → recordatorio 24h encolado para n8n                  |
| HP-10 | Confirmación inmediata WhatsApp al inscribirse (opcional, si tenant lo activa) |

---

## 5. Sad path — matriz resumida

| ID    | Escenario                       | Resultado esperado                                        |
| ----- | ------------------------------- | --------------------------------------------------------- |
| SP-01 | Cupo lleno                      | Error amigable; sin overbooking                           |
| SP-02 | Doble inscripción mismo alumno  | Una inscripción por alumno/sesión                         |
| SP-03 | Eliminar sesión con inscritos   | Confirmación + cancelación enrollments + cancel reminders |
| SP-04 | Editar sesión pasada            | Solo lectura o edición limitada                           |
| SP-05 | Sin permiso staff               | 403                                                       |
| SP-06 | Asistencia sin enrollment       | Bloqueado                                                 |
| SP-07 | Fallo red al guardar asistencia | Feedback + reintento                                      |
| SP-08 | Cross-tenant ID                 | NotFound / 403                                            |
| SP-09 | Sin teléfono al inscribir       | Sin recordatorio; inscripción OK                          |
| SP-10 | n8n falla envío                 | Fila `failed` en cola; reintento según `max_attempts`     |

---

## 6. Pantallas y rutas

| Pantalla                    | Ruta propuesta                                                | Actor            | Notas                                            |
| --------------------------- | ------------------------------------------------------------- | ---------------- | ------------------------------------------------ |
| Home sesiones del día       | `/t/[tenant]/admin` o extensión `HomeTenant`                  | Maestro / admin  | Mobile-first; cards por sesión                   |
| CRUD sesiones/clases        | `/t/[tenant]/admin/sessions`                                  | Maestro / admin  | Crear, editar, eliminar                          |
| Detalle sesión + asistencia | `/t/[tenant]/admin/sessions/[id]` (opcional) o inline en home | Maestro          | Palomitas por alumno                             |
| Inscripción pública         | `/t/[tenant]/sessions`                                        | Alumno / público | Lista sesiones abiertas + formulario inscripción |
| Plantillas notificaciones   | `/t/[tenant]/admin/notifications` (existente)                 | Admin            | Extender plantillas para sesiones                |

**Navegación admin:** enlace "Sesiones" en sidebar/grid solo para tenants deportivos.

---

## 7. Modelo de datos

### 7.1 Tablas nuevas

```sql
-- Instancia de clase/evento programado
class_sessions (
  id              UUID PK,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ NOT NULL,
  max_capacity    INTEGER NOT NULL CHECK (max_capacity > 0),
  staff_id        UUID REFERENCES staff(id),
  status          VARCHAR(20) DEFAULT 'scheduled',  -- scheduled | cancelled | completed
  location        VARCHAR(255),                     -- opcional: cancha, pista
  social_export   JSONB,                            -- futuro: imagen, copy, hashtags
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Inscripción de alumno a sesión (roster)
session_enrollments (
  id              UUID PK,
  session_id      UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES customers(id),
  tenant_id       UUID NOT NULL,                    -- denormalizado para RLS
  status          VARCHAR(20) DEFAULT 'active',     -- active | cancelled
  enrolled_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id, customer_id)
);

-- Asistencia por inscripción
session_attendance (
  id              UUID PK,
  enrollment_id   UUID NOT NULL UNIQUE REFERENCES session_enrollments(id),
  present         BOOLEAN NOT NULL DEFAULT FALSE,
  marked_at       TIMESTAMPTZ,
  marked_by       UUID REFERENCES users(id)
);
```

### 7.2 Invariantes de negocio

- `COUNT(enrollments WHERE session_id = X AND status = 'active') <= max_capacity`
- Un `customer_id` solo una vez por `session_id`
- Asistencia solo sobre `session_enrollments` con `status = 'active'`
- Todas las queries filtradas por `tenant_id` (RLS)

### 7.3 Índices sugeridos

```sql
CREATE INDEX idx_class_sessions_tenant_starts ON class_sessions(tenant_id, starts_at);
CREATE INDEX idx_session_enrollments_session ON session_enrollments(session_id, status);
CREATE INDEX idx_session_enrollments_customer ON session_enrollments(customer_id);
```

---

## 8. API (Result Pattern)

Base: `/api/tenants/[tenant]/sessions`

| Método | Ruta                         | Descripción                                 | Auth            |
| ------ | ---------------------------- | ------------------------------------------- | --------------- |
| GET    | `/sessions`                  | Listar sesiones (filtros: `date`, `status`) | staff+          |
| POST   | `/sessions`                  | Crear sesión                                | admin/staff     |
| GET    | `/sessions/[id]`             | Detalle + roster                            | staff+          |
| PATCH  | `/sessions/[id]`             | Editar sesión                               | admin/staff     |
| DELETE | `/sessions/[id]`             | Eliminar / cancelar sesión                  | admin/staff     |
| GET    | `/sessions/[id]/enrollments` | Listar inscritos                            | staff+          |
| POST   | `/sessions/[id]/enrollments` | Inscripción pública o admin                 | público / staff |
| PATCH  | `/sessions/[id]/attendance`  | Marcar asistencia (batch)                   | staff+          |

**Implementación obligatoria:**

- `withResultHandler()` en rutas
- Zod schemas en request/response
- `DomainError`: `ValidationError`, `NotFoundError`, `ConflictError` (cupo lleno), `ForbiddenError`

### 8.1 Ejemplo Zod — crear sesión

```typescript
const CreateSessionSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  maxCapacity: z.number().int().min(1).max(100),
  staffId: z.string().uuid().optional(),
  location: z.string().max(255).optional(),
});
```

### 8.2 Ejemplo Zod — inscripción pública

```typescript
const EnrollSessionSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(10),
  customerEmail: z.string().email().optional(),
});
```

---

## 9. Notificaciones WhatsApp / email (n8n)

### 9.1 Arquitectura (existente — reutilizar)

```
App encola → scheduled_notifications (pending)
           → n8n poll GET /api/internal/scheduled-notifications
           → envía WhatsApp Cloud API / email
           → PATCH sent | failed
```

Referencia: `docs/integrations/n8n-scheduled-notifications.md`

### 9.2 Eventos que encolan notificaciones

| Evento                           | template_key                      | scheduled_at        | Canal    |
| -------------------------------- | --------------------------------- | ------------------- | -------- |
| Alumno se inscribe               | `session_enrollment_confirmation` | inmediato (`now()`) | whatsapp |
| Recordatorio 24h antes           | `session_reminder_24h`            | `starts_at - 24h`   | whatsapp |
| Recordatorio 1h antes (opcional) | `session_reminder_1h`             | `starts_at - 1h`    | whatsapp |
| Sesión reprogramada              | `session_reschedule`              | inmediato           | whatsapp |
| Sesión cancelada                 | `session_cancelled`               | inmediato           | whatsapp |
| Recordatorio email (si email)    | `session_reminder_24h`            | `starts_at - 24h`   | email    |

### 9.3 Reglas de encolado

1. **Al inscribirse:** si hay teléfono válido (≥10 dígitos) → encolar `session_reminder_24h` y opcionalmente `session_reminder_1h` (mismo patrón que `booking-reminder-notification.ts`).
2. **Al reprogramar sesión:** cancelar recordatorios `pending` de todos los enrollments activos → re-encolar con nuevo `starts_at`.
3. **Al cancelar sesión o enrollment:** cancelar recordatorios `pending` (`status → cancelled`).
4. **Idempotencia:**

   ```
   session_reminder_24h:{enrollmentId}:{startsIso}
   session_reminder_1h:{enrollmentId}:{startsIso}
   session_enrollment_confirmation:{enrollmentId}
   ```

5. **related_entity_type:** `session_enrollment`  
   **related_entity_id:** `enrollment.id`  
   **payload:**

   ```json
   {
     "tenantSlug": "centro-tenistico",
     "sessionTitle": "Clase Grupal Principiantes",
     "sessionDateTime": "2026-06-10 09:00",
     "location": "Cancha 2",
     "startIso": "2026-06-10T15:00:00.000Z"
   }
   ```

### 9.4 Plantillas por tenant

Extender `GET/PUT /api/tenants/{tenant}/notifications/templates` con claves:

| Key                             | Placeholders                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| `sessionReminder24h`            | `{{customerName}}`, `{{tenantName}}`, `{{sessionTitle}}`, `{{sessionDateTime}}`, `{{location}}` |
| `sessionReminder1h`             | idem                                                                                            |
| `sessionEnrollmentConfirmation` | idem                                                                                            |
| `sessionReschedule`             | `{{previousDateTime}}`, `{{newDateTime}}`                                                       |
| `sessionCancelled`              | `{{sessionTitle}}`, `{{sessionDateTime}}`                                                       |

**Texto default (español MX):**

> Hola {{customerName}}, te recordamos que mañana tienes clase **{{sessionTitle}}** en {{tenantName}} a las {{sessionDateTime}}.

### 9.5 Archivos a crear/extender

| Archivo                                                         | Acción                                               |
| --------------------------------------------------------------- | ---------------------------------------------------- |
| `apps/web/lib/notifications/session-reminder-notification.ts`   | Nuevo — patrón de `booking-reminder-notification.ts` |
| `apps/web/lib/notifications/session-enrollment-notification.ts` | Nuevo — confirmación al inscribir                    |
| `apps/web/lib/notifications/session-cancelled-notification.ts`  | Nuevo                                                |
| `apps/web/lib/notifications/scheduled-notification-queue.ts`    | Reutilizar                                           |
| `apps/web/lib/notifications/notification-template.ts`           | Extender plantillas sesión                           |

### 9.6 n8n

- **No calcular horarios en n8n** — solo enviar filas `pending` cuando `scheduled_at <= NOW()`.
- Opcional: rama Switch por `template_key` para sesiones vs bookings.
- Filtro por tenant: `GET ...?tenantSlug=centro-tenistico`.

---

## 10. UI / UX

### 10.1 Home maestro

- Cards por sesión: título, hora, instructor, badge cupo `3/8`
- Tap/expand → lista alumnos con checkbox/palomita asistencia
- Acceso rápido a "Ver todas" → `/admin/sessions`

### 10.2 Pantalla CRUD sesiones

- Tabla/lista sesiones futuras y pasadas (tabs o filtro)
- Formulario: título, fecha, hora inicio/fin, cupo, instructor (select staff), descripción, ubicación
- Acciones: editar, eliminar (confirmación si hay inscritos)
- `data-testid` en elementos clave para E2E

### 10.3 Inscripción pública

- Lista sesiones abiertas (fecha, hora, cupo restante)
- Formulario: nombre, teléfono (requerido para recordatorio), email opcional
- Mensaje éxito + copy "Te enviaremos un recordatorio por WhatsApp"

### 10.4 Terminología

Usar `getClientTerms(tenantSlug)` → **Alumno**, **Clase**, **Sesión** (no "Clienta").

---

## 11. Seguridad y RLS

- Políticas RLS en `class_sessions`, `session_enrollments`, `session_attendance` por `tenant_id`
- Inscripción pública: rate limit por IP (patrón existente en bookings)
- Validar cupo en transacción (SELECT FOR UPDATE o constraint + retry)
- No filtrar stack traces en respuestas API

---

## 12. Preparación redes sociales (futuro — datos only)

Campos en `class_sessions.social_export` (JSONB):

```json
{
  "headline": "Clase grupal sábado 9am",
  "caption": "...",
  "hashtags": ["#tenis", "#clasegrupal"],
  "imageUrl": null,
  "publishedAt": null
}
```

La publicación automática vía n8n social (`plans/n8n-social-media-workflow.md`) queda **fuera de MVP**; solo persistir metadatos exportables.

---

## 13. Fuera de MVP

| Item                                              | Notas                                 |
| ------------------------------------------------- | ------------------------------------- |
| Recurrencia semanal ("todos los martes")          | Crear sesiones individualmente en MVP |
| Migración automática bookings 1:1 → sesiones      | Conviven ambos flujos                 |
| Walk-in sin inscripción previa                    | Futuro                                |
| Publicación automática a redes                    | Solo campos `social_export`           |
| Estados asistencia avanzados (tarde, justificado) | Binario presente/ausente en MVP       |

---

## 14. Testing

### Unitarios (`tests/unit/`)

- Servicios: crear sesión, inscribir, validar cupo, marcar asistencia, encolar recordatorios
- `expectSuccess` / `expectFailure` para Result Pattern
- Idempotencia de enrollments y notificaciones

### E2E (`tests/e2e/`)

- Tag/grep: `sesiones-deportivas` o `STRY-XXX`
- Tenant: `centro-tenistico`
- Credencial: `jagzao@gmail.com` / `admin`
- Casos: HP-01 a HP-09, SP-01, SP-02, SP-05

### Notificaciones

- Mock cola `scheduled_notifications` — verificar fila `session_reminder_24h` con `scheduled_at` correcto al inscribir

---

## 15. Asunciones validadas

| #   | Asunción                                                 | Estado |
| --- | -------------------------------------------------------- | ------ |
| 1   | Solo tenants deportivos (heurística slug)                | ✅     |
| 2   | Home = dashboard operativo staff, no landing marketing   | ✅     |
| 3   | Sesión = evento grupal con cupo N                        | ✅     |
| 4   | Alumno = `customers` existente o alta en inscripción     | ✅     |
| 5   | Asistencia binaria: presente / ausente                   | ✅     |
| 6   | Editar asistencia hasta fin del día de la sesión         | ✅     |
| 7   | CRUD completo con confirmación al eliminar con inscritos | ✅     |
| 8   | Cupo obligatorio y enforced                              | ✅     |
| 9   | Inscripción pública sin login; teléfono para dedupe      | ✅     |
| 10  | Convive con `/book` 1:1; sin migración                   | ✅     |
| 11  | Instructor = `staff`                                     | ✅     |
| 12  | Social: solo campos exportables en MVP                   | ✅     |
| 13  | Permisos: admin/staff maestro                            | ✅     |
| 14  | UI mobile-first en home                                  | ✅     |
| 15  | Español; terminología Alumno/Clase                       | ✅     |
| 16  | **Notificaciones WhatsApp/email vía n8n — IN MVP**       | ✅     |
| 17  | Sin recurrencia en MVP                                   | ✅     |
| 18  | Piloto: `centro-tenistico`                               | ✅     |
| 19  | **Múltiples alumnos por sesión** (vs wondernails 1:1)    | ✅     |

---

## 16. Referencias de código existente

| Área                                | Archivo                                                       |
| ----------------------------------- | ------------------------------------------------------------- |
| Terminología Alumno                 | `apps/web/lib/tenant/client-terminology.ts`                   |
| Cola notificaciones                 | `apps/web/lib/notifications/scheduled-notification-queue.ts`  |
| Recordatorios booking (patrón)      | `apps/web/lib/notifications/booking-reminder-notification.ts` |
| Integración n8n                     | `docs/integrations/n8n-scheduled-notifications.md`            |
| Admin notificaciones UI             | `apps/web/app/t/[tenant]/admin/notifications/`                |
| Booking público CTV (referencia UX) | `apps/web/app/t/[tenant]/book/`                               |
| Home staff                          | `apps/web/components/home/HomeTenant.tsx`                     |
| Schema DB                           | `packages/database/schema.ts`                                 |

---

## 17. Definition of Done

- [ ] Migraciones DB aplicadas con RLS
- [ ] APIs con Result Pattern + tests unitarios
- [ ] UI home + CRUD + inscripción pública
- [ ] Multi-alumno por sesión verificado E2E
- [ ] Recordatorio 24h encolado al inscribir (con teléfono)
- [ ] Reprogramación/cancelación cancela y re-encola recordatorios
- [ ] `npm run lint`, `typecheck`, `build` verdes
- [ ] E2E headless grep `sesiones-deportivas` verde
- [ ] Documentación n8n actualizada con nuevos `template_key`

---

_Última actualización: 2026-06-02_
