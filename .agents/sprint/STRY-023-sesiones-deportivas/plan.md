# Plan de Ejecución — STRY-023 Sesiones deportivas

**Spec:** `.specs/sesiones_deportivas.md`  
**Story:** `docs/stories/active/STRY-023-sesiones-deportivas.md`  
**Tenant piloto:** `centro-tenistico`

---

## Objetivo

Entregar módulo de **clases grupales** para tenants deportivos: sesiones con **múltiples alumnos**, inscripción pública con cupo, asistencia en home admin, CRUD de sesiones, y recordatorios WhatsApp/email vía `scheduled_notifications` + n8n.

---

## Pasos numerados

### 1. Detección tenant deportivo + migración DB

- Crear `apps/web/lib/tenant/is-sports-tenant.ts` (heurística slug: `tenistico`, `tenis`, etc.).
- Migración SQL: `class_sessions`, `session_enrollments`, `session_attendance`.
- Actualizar `packages/database/schema.ts` (Drizzle).
- Aplicar RLS policies por `tenant_id`.
- **Hecho:** migración aplicable; tablas visibles en schema.

### 2. Servicios de dominio (Result Pattern)

| Archivo                                               | Responsabilidad                   |
| ----------------------------------------------------- | --------------------------------- |
| `apps/web/lib/services/class-session-service.ts`      | CRUD sesión, listar por fecha     |
| `apps/web/lib/services/session-enrollment-service.ts` | Inscribir, cancelar, validar cupo |
| `apps/web/lib/services/session-attendance-service.ts` | Marcar presente/ausente batch     |

- **Hecho:** funciones retornan `Result<T, DomainError>`; sin try/catch en lógica de negocio.

### 3. Notificaciones (n8n)

| Archivo                                                         | Responsabilidad               |
| --------------------------------------------------------------- | ----------------------------- |
| `apps/web/lib/notifications/session-reminder-notification.ts`   | 24h / 1h antes                |
| `apps/web/lib/notifications/session-enrollment-notification.ts` | Confirmación al inscribir     |
| `apps/web/lib/notifications/session-cancelled-notification.ts`  | Cancelación sesión/enrollment |

- Extender `notification-template.ts` con claves `sessionReminder24h`, etc.
- Cancelar/re-encolar en PATCH sesión y DELETE (patrón `cancelPendingBookingNotifications`).
- Actualizar `docs/integrations/n8n-scheduled-notifications.md` § plantillas sesión.
- **Hecho:** al POST enrollment con teléfono → fila `session_reminder_24h` en BD.

### 4. API routes

```
apps/web/app/api/tenants/[tenant]/sessions/route.ts
apps/web/app/api/tenants/[tenant]/sessions/[id]/route.ts
apps/web/app/api/tenants/[tenant]/sessions/[id]/enrollments/route.ts
apps/web/app/api/tenants/[tenant]/sessions/[id]/attendance/route.ts
```

- `withResultHandler`, Zod, auth staff para mutaciones; POST enrollment público con rate limit.
- **Hecho:** curl/Postman crea sesión, inscribe, marca asistencia en CTV.

### 5. UI — Home maestro (sesiones del día)

- Extender `HomeTenant.tsx` o bloque condicional `isSportsTenant(slug)`:
  - Cards sesiones hoy: título, hora, cupo `n/max`, instructor.
  - Expand → roster + palomitas (`data-testid` para E2E).
- Enlace en `BusinessNavGrid` → "Sesiones" → `/admin/sessions`.
- **Hecho:** maestro logueado en CTV ve sesiones y marca asistencia.

### 6. UI — CRUD admin sesiones

- `apps/web/app/t/[tenant]/admin/sessions/page.tsx`
- `apps/web/app/t/[tenant]/admin/sessions/SessionsAdminClient.tsx`
- Formulario crear/editar; confirmación eliminar con inscritos.
- **Hecho:** CRUD completo sin errores consola.

### 7. UI — Inscripción pública

- `apps/web/app/t/[tenant]/sessions/page.tsx`
- `SessionsPublicClient.tsx` — lista sesiones abiertas + form inscripción.
- Match/crear `customers` por teléfono (reutilizar lógica `match-customer` si existe).
- **Hecho:** visitante se anota y aparece en roster admin.

### 8. Tests unitarios

- `tests/unit/services/class-session-service.spec.ts`
- `tests/unit/services/session-enrollment-service.spec.ts`
- `tests/unit/services/session-attendance-service.spec.ts`
- `tests/unit/notifications/session-reminder-notification.spec.ts`
- **Hecho:** `npm run test:unit -- --grep "session|ClassSession"` verde.

### 9. Tests E2E

- `tests/e2e/sesiones-deportivas.spec.ts` — tag `STRY-023` / grep `sesiones-deportivas`
- Alineado a `testing-usuario.md`.
- **Hecho:** headless verde en `centro-tenistico`.

### 10. Pipeline validación

```bash
npx prettier --write "apps/**/*.{ts,tsx}" "packages/**/*.{ts,tsx}"
npm run lint && npm run typecheck && npm run build
npm run test:unit -- --grep "session|ClassSession"
npm run test:e2e:subset -- --grep "sesiones-deportivas"
```

---

## Orden de dependencias

```
1 DB → 2 Services → 3 Notifications → 4 API → 5 Home UI → 6 Admin CRUD → 7 Public enroll → 8 UT → 9 E2E → 10 Pipeline
```

---

## Asunciones / defaults

- Spec aprobada: `.specs/sesiones_deportivas.md` (2026-06-02).
- Solo tenants deportivos; wondernails no ve el módulo.
- `/book` 1:1 sigue activo; sin migración de bookings.
- Credencial QA: `jagzao@gmail.com` / `admin`.
- Recordatorio 24h (+ opcional 1h) en MVP; email si `recipient_email` presente.
- Asistencia binaria; sin recurrencia semanal en MVP.
- `social_export` JSONB en sesión — solo persistencia, sin publicar a redes.

---

## Riesgos

| #   | Riesgo                              | Mitigación                                       |
| --- | ----------------------------------- | ------------------------------------------------ |
| R1  | Overbooking concurrente             | TX + `SELECT FOR UPDATE` o unique + retry        |
| R2  | CTV home = landing                  | Documentar ruta `/admin`; E2E entra por `/admin` |
| R3  | n8n no reconoce template_key nuevos | Doc + defaults; workflow Switch opcional         |

---

## Estimación

| Fase                   | Esfuerzo     |
| ---------------------- | ------------ |
| DB + servicios + notif | 1–2 días     |
| API + UI (3 pantallas) | 2–3 días     |
| Tests + QA             | 1 día        |
| **Total**              | **4–6 días** |
