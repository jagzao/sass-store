# Implementación — STRY-023 Sesiones deportivas

**Spec:** `.specs/sesiones_deportivas.md`  
**Story:** `docs/stories/active/STRY-023-sesiones-deportivas.md`  
**Estado implementación:** Done — visto bueno PO 2026-06-03

---

## Trazabilidad CA → Código → Tests

| CA                       | Entregable                         | Archivos previstos                                    | Test                |
| ------------------------ | ---------------------------------- | ----------------------------------------------------- | ------------------- |
| CA-1 Home roster         | Lista sesiones hoy + expand roster | `HomeTenant.tsx`, `SessionsTodaySection.tsx` (nuevo)  | E2E SC-01, SC-02    |
| CA-2 Asistencia          | Palomita persistida                | `session-attendance-service.ts`, API PATCH attendance | E2E SC-03, UT       |
| CA-3 CRUD                | Pantalla admin sessions            | `admin/sessions/*`                                    | E2E SC-04, SC-05    |
| CA-4 Inscripción pública | `/sessions` + enrollment API       | `sessions/page.tsx`, enrollments route                | E2E SC-06, SC-07    |
| CA-5 Cupo / duplicado    | ConflictError en servicio          | `session-enrollment-service.ts`                       | E2E SC-08, UT       |
| CA-6 Permisos            | Guards en API                      | middleware auth existente                             | E2E SC-09           |
| CA-7 Notificaciones      | Encolado 24h                       | `session-reminder-notification.ts`                    | UT + query BD SC-10 |

---

## Capas

### Base de datos

```text
packages/database/migrations/00XX_class_sessions.sql
packages/database/schema.ts  → classSessions, sessionEnrollments, sessionAttendance
```

### Servicios

```text
apps/web/lib/services/class-session-service.ts
apps/web/lib/services/session-enrollment-service.ts
apps/web/lib/services/session-attendance-service.ts
apps/web/lib/tenant/is-sports-tenant.ts
```

### Notificaciones

```text
apps/web/lib/notifications/session-reminder-notification.ts
apps/web/lib/notifications/session-enrollment-notification.ts
apps/web/lib/notifications/session-cancelled-notification.ts
apps/web/lib/notifications/notification-template.ts  (extend)
```

### API

```text
apps/web/app/api/tenants/[tenant]/sessions/route.ts
apps/web/app/api/tenants/[tenant]/sessions/[id]/route.ts
apps/web/app/api/tenants/[tenant]/sessions/[id]/enrollments/route.ts
apps/web/app/api/tenants/[tenant]/sessions/[id]/attendance/route.ts
```

### UI

```text
apps/web/app/t/[tenant]/admin/sessions/page.tsx
apps/web/app/t/[tenant]/admin/sessions/SessionsAdminClient.tsx
apps/web/app/t/[tenant]/sessions/page.tsx
apps/web/components/sessions/SessionsTodaySection.tsx
apps/web/components/home/sections/BusinessNavGrid.tsx  (link Sesiones)
```

### Tests

```text
tests/unit/services/class-session-service.spec.ts
tests/unit/services/session-enrollment-service.spec.ts
tests/unit/services/session-attendance-service.spec.ts
tests/unit/notifications/session-reminder-notification.spec.ts
tests/e2e/sesiones-deportivas.spec.ts
```

---

## Checklist de implementación

- [x] Migración `0018_class_sessions.sql` + Schema Drizzle
- [x] `ClassSessionService` (Result Pattern)
- [x] `session-reminder-notification.ts` + `session-enrollment-notification.ts`
- [x] `getTenantSessionTemplates` en `notification-template.ts`
- [x] `cancelPendingSessionEnrollmentNotifications` en cola
- [x] API: `sessions/route`, `[id]/route`, `enrollments`, `attendance`
- [x] UI: `SessionsTodaySection`, `admin/sessions`, `sessions` público
- [x] `HomeTenant` + `BusinessNavGrid` (sports only)
- [x] UT `class-session-service.spec.ts` (4 tests)
- [x] E2E `sesiones-deportivas.spec.ts` (4/4 con `BASE_URL=http://127.0.0.1:3003`)
- [x] Migración aplicada: `npm run db:migrate:class-sessions`
- [x] Landing CTV: enlaces `/book`, `/sessions`, CTA clases
- [x] `middleware.ts` fusionado en `proxy.ts` (fix build Next 16)

---

## Visto bueno (2026-06-03)

Dueño de producto aprobó entrega («ambos»: documentar visto bueno + reintentar build). Story en `docs/stories/completed/STRY-023-sesiones-deportivas.md`.

## Evidencia QA

| Comando                                                                   | Resultado                                                           |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `npx vitest run tests/unit/services/class-session-service.spec.ts`        | ✅ 4/4                                                              |
| `npm run test:e2e:subset -- --grep "sesiones-deportivas"` (BASE_URL 3003) | ✅ 4/4                                                              |
| `npm run db:migrate:class-sessions`                                       | ✅ Aplicada                                                         |
| `npx tsc --noEmit` (apps/web)                                             | ✅                                                                  |
| `npm run build`                                                           | ✅ (fix infra: `tenant-static-params.ts`, checkout `force-dynamic`) |

---

## Notas post-implementación

_(El agente completa esta sección al cerrar Fase 3–4.)_
