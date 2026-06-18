# Plan de ejecución — STRY-025: Mejoras calendario, citas y notificaciones

> Origen: `docs/stories/active/STRY-025-mejoras-calendario-citas-notificaciones.md`
> Fase actual: PM cerrado → Architect / Dev / QA

---

## Asunciones / defaults (ninguna pregunta abierta del dueño)

1. La navegación temporal en el panel de citas usará un control Día/Semana/Mes con botones Anterior/Siguiente.
2. Las citas vencidas en estado pendiente o cotizada mostrarán un modal/banner de seguimiento obligatorio antes de permitir otras acciones.
3. El webhook n8n ya está configurado en el entorno; solo se invoca desde el backend al confirmar.
4. El botón de cotización genérico se reemplaza por "Enviar por WhatsApp" que guarda y genera enlace.
5. El calendario conserva la librería base pero se rediseña visualmente y cierra modal al tocar día.

---

## Alcance de implementación (pasos numerados)

### Paso 1: Servicios de dominio (Result Pattern)
- `lib/services/appointmentService.ts`
  - `getOverdueAppointments(tenantId)` → citas con fecha < now y estado ∈ {pendiente, cotizada}
  - `updateAppointmentStatus(id, action, newDate?)` → confirmar, rechazar, mover
- `lib/services/notificationService.ts`
  - `sendAppointmentConfirmationWebhook(appointment)` → POST a URL n8n, no bloqueante
- `lib/services/quotationService.ts`
  - `saveAndGenerateWhatsAppLink(quotation)` → guardar, retornar `https://wa.me/{phone}?text={msg}`

### Paso 2: API Routes (withResultHandler)
- `app/api/appointments/overdue/route.ts` → GET
- `app/api/appointments/[id]/status/route.ts` → PATCH
- `app/api/appointments/[id]/confirm/route.ts` → POST (wrapper que llama status + notification)
- `app/api/quotations/[id]/send-whatsapp/route.ts` → POST

### Paso 3: UI — Panel de citas (Admin Home)
- `AppointmentNavigation` component: botones Hoy / Mañana / Semana / Mes + Anterior / Siguiente
- `OverdueNotification` component: modal/banner con opciones Confirmar / Rechazar / Mover
- Integrar en `app/(admin)/[tenant]/admin/page.tsx` (o ruta equivalente del panel de citas)

### Paso 4: UI — Calendario rediseñado
- `CalendarPicker` refactor: selección de día cierra modal inmediatamente (`onSelect` + `onClose`)
- Aplicar rediseño visual (colores, tipografía, espaciado) sin cambiar librería base
- Verificar instancias en: panel admin, POS, reservas frontend

### Paso 5: UI — Cotización WhatsApp
- Reemplazar botón "Cotizar" por "Enviar por WhatsApp" en detalle de cita
- Guardar cotización al tocar botón, luego abrir enlace `wa.me`

### Paso 6: Tests unitarios (Vitest)
- `tests/unit/services/appointmentService.spec.ts`
- `tests/unit/services/notificationService.spec.ts`
- `tests/unit/services/quotationService.spec.ts`
- Helpers: `expectSuccess`, `expectFailure` para Result Pattern

### Paso 7: Tests E2E (Playwright)
- `tests/e2e/appointment-navigation.spec.ts` — Día/Semana/Mes + Anterior/Siguiente
- `tests/e2e/overdue-followup.spec.ts` — modal de seguimiento, acciones Confirmar/Rechazar/Mover
- `tests/e2e/calendar-picker.spec.ts` — selección rápida de fecha, cierre modal
- `tests/e2e/quotation-whatsapp.spec.ts` — guardar cotización y abrir enlace WA
- Ejecutar en tenants: wondernails, centro-tenistico

### Paso 8: QA + Fix loop (bucle Dev↔QA)
- Headed Playwright para inspección visual
- Corregir bugs → re-ejecutar headless hasta cero fallos
- Cobertura ≥80%

---

## Criterios de “hecho” por paso

| Paso | Criterio de hecho |
|------|-------------------|
| 1 | Todos los servicios devuelven `Result<T, DomainError>`; tests unitarios verdes |
| 2 | Rutas responden correctamente con `withResultHandler`; tests de integración verdes |
| 3 | Panel muestra citas filtradas por periodo; navegación funciona sin recarga completa |
| 4 | Modal de calendario se cierra al tocar día; rediseño aplicado en todas las instancias |
| 5 | Botón WA guarda cotización y abre enlace; botón genérico de cotización removido |
| 6 | Cobertura de servicios ≥80% |
| 7 | Todos los specs E2E pasan en headless para wondernails y centro-tenistico |
| 8 | Build, lint, typecheck verdes; `testing-usuario.md` ejecutado al 100% |

---

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| n8n webhook falla o no está configurado | Notificación no llega | No bloquear confirmación; log error + aviso discreto |
| Rediseño rompe otras pantallas con calendario | Regresión visual | Validar todas las instancias con E2E |
| Citas vencidas en grandes volúmenes | Performance en carga | Paginar consulta de overdue (limit 50) |

---

## Archivos a tocar (lista ordenada)

```
apps/web/
├── lib/services/appointmentService.ts          [nuevo/modificar]
├── lib/services/notificationService.ts         [nuevo]
├── lib/services/quotationService.ts              [nuevo/modificar]
├── app/api/appointments/overdue/route.ts         [nuevo]
├── app/api/appointments/[id]/status/route.ts    [nuevo]
├── app/api/appointments/[id]/confirm/route.ts  [nuevo]
├── app/api/quotations/[id]/send-whatsapp/route.ts [nuevo]
├── components/calendar/CalendarPicker.tsx        [modificar]
├── components/appointments/AppointmentNavigation.tsx [nuevo]
├── components/appointments/OverdueNotification.tsx   [nuevo]
├── app/(admin)/[tenant]/admin/page.tsx           [modificar]
├── app/(admin)/[tenant]/admin/appointments/page.tsx  [modificar si existe]
└── [otras rutas con calendario]                  [verificar]
```

---

_Última actualización: 2026-06-06_
