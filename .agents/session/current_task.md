# Current Task - sass-store

> **Protocolo:** Ciclo de ejecución con autocorrección (autonomous-loop)
> **Última actualización:** 2026-06-17
> **Estado anterior:** ✅ COMPLETADO 2026-04-27 (POS, Booking, Retouch, Cart, Inventory)

---

## STRYs activas en este sprint

| STRY | Nombre | Estado |
|------|--------|--------|
| STRY-023 | Sesiones deportivas (clases grupales) | 🔄 EN PROGRESO |
| STRY-024 | Editar datos personales del cliente desde expediente | 🔄 EN PROGRESO |
| STRY-025 | Mejoras calendario, citas y notificaciones | 🔄 EN PROGRESO |
| feedback-icon-tenant-header | Ícono de feedback junto al logo del tenant en TenantHeader | 📝 SPEC LISTA |

---

## STRY-023 — Sesiones deportivas
Módulo de clases grupales para tenants deportivos. Sesiones con múltiples alumnos,
inscripción pública con cupo, asistencia en home admin, CRUD, recordatorios WhatsApp/email.
Tenant piloto: centro-tenistico
Plan: .agents/sprint/STRY-023-sesiones-deportivas/plan.md

---

## STRY-024 — Editar cliente desde expediente
Botón Editar en CustomerFileHeader para editar inline nombre, teléfono, email, cumpleaños, dirección, estado.
Plan: .agents/sprint/STRY-024-editar-cliente-expediente/plan.md

---

## STRY-025 — Mejoras calendario y notificaciones
Navegación Día/Semana/Mes, modal seguimiento citas vencidas, botón WhatsApp con enlace, rediseño calendario.
Plan: .agents/sprint/STRY-025-mejoras-calendario-citas-notificaciones/plan.md
Test spec: .agents/sprint/STRY-025-mejoras-calendario-citas-notificaciones/test-spec.md

---

## feedback-icon-tenant-header — Ícono de feedback junto al logo del tenant
Ícono junto al logo en `TenantHeader` (todos los tenants) que abre el panel de feedback existente
(`FeedbackWidget` + `FeedbackWidgetContext`, ya montado global en `app/layout.tsx`). El botón flotante
inferior derecho se mantiene. Visible en variantes default/transparent/dark, con/sin scroll, y en mobile.
Spec: .agents/memory/tasks/feedback-icon-tenant-header.md

---

## Pipeline de calidad activo

/spec → /feature-developer → /test-implementation → /quality-runner → /multi-review → PR

## Reglas activas
- Result Pattern obligatorio en código nuevo
- RLS con tenant_id en todas las tablas nuevas
- No tocar apps/web/app/api/debug/ en producción
- Actualizar APP_STATE.md si cambia algún invariante
