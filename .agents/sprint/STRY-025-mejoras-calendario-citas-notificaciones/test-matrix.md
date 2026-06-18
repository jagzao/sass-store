# Test Matrix — STRY-025: Mejoras calendario, citas y notificaciones

| ID    | Scenario                                                                 | Tipo de test       | Archivo destino                                              | Prioridad | Estado     |
|-------|--------------------------------------------------------------------------|--------------------|--------------------------------------------------------------|-----------|------------|
| SC-01 | Selección rápida de fecha en calendario (cierra modal al tocar día)      | E2E                | `tests/e2e/calendar-picker.spec.ts`                          | Alta      | ✅ implementado |
| SC-02 | Vista por defecto (hoy) en panel de citas                                | E2E                | `tests/e2e/appointment-navigation.spec.ts`                   | Alta      | ✅ implementado |
| SC-03 | Avanzar a mañana en panel de citas                                       | E2E                | `tests/e2e/appointment-navigation.spec.ts`                   | Alta      | ✅ implementado |
| SC-04 | Vista semanal en panel de citas                                          | E2E                | `tests/e2e/appointment-navigation.spec.ts`                   | Alta      | ✅ implementado |
| SC-05 | Vista mensual en panel de citas                                        | E2E                | `tests/e2e/appointment-navigation.spec.ts`                   | Alta      | ✅ implementado |
| SC-06 | Navegación hacia adelante y atrás (Día/Semana/Mes)                       | E2E                | `tests/e2e/appointment-navigation.spec.ts`                   | Alta      | ✅ implementado |
| SC-07 | Cita vencida en estado pendiente → notificación modal                    | E2E                | `tests/e2e/overdue-followup.spec.ts`                         | Alta      | ✅ implementado |
| SC-08 | Cita vencida en estado cotizada → notificación modal                     | E2E                | `tests/e2e/overdue-followup.spec.ts`                         | Alta      | ✅ implementado |
| SC-09 | Administrador confirma cita vencida desde notificación                 | E2E                | `tests/e2e/overdue-followup.spec.ts`                         | Alta      | ✅ implementado |
| SC-10 | Administrador rechaza cita vencida desde notificación                  | E2E                | `tests/e2e/overdue-followup.spec.ts`                         | Alta      | ✅ implementado |
| SC-11 | Administrador mueve cita vencida desde notificación                    | E2E                | `tests/e2e/overdue-followup.spec.ts`                         | Alta      | ✅ implementado |
| SC-12 | Notificación n8n al confirmar cita                                      | Integration + Unit | `tests/integration/api/appointments.spec.ts` + `tests/unit/services/notificationService.spec.ts` | Alta      | ✅ implementado (unit) |
| SC-13 | Guardar y enviar cotización por WhatsApp                                | E2E                | `tests/e2e/quotation-whatsapp.spec.ts`                       | Alta      | ✅ implementado |
| SC-14 | Botón de cotización removido tras guardar cotización                    | E2E                | `tests/e2e/quotation-whatsapp.spec.ts`                       | Media     | ✅ implementado |
| SC-15 | Rediseño de componente calendario (visual + cierre rápido)              | E2E                | `tests/e2e/calendar-picker.spec.ts`                          | Media     | ✅ implementado |
| SC-16 | Manejo de errores: webhook n8n falla pero cita se confirma             | Integration + Unit | `tests/unit/services/notificationService.spec.ts` + `tests/integration/api/appointments.spec.ts` | Alta      | ✅ implementado (unit) |
