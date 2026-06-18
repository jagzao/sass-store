# Test Strategy — STRY-025: Mejoras calendario, citas y notificaciones

## Objetivo de calidad
Cubrir la navegación temporal del panel de citas, el seguimiento forzoso de citas vencidas, la notificación n8n al confirmar, el envío de cotización por WhatsApp y el rediseño del calendario, garantizando que no haya regresiones multitenant ni fugas de estado pendiente/cotizado.

---

## Stack de este proyecto

- Unit/Integration: Vitest (`npm run test:unit`, `npm run test:integration`)
- E2E: Playwright (`npm run test:e2e:subset -- --grep "STRY-025"`)
- Security: `npm run test:security`
- Coverage: `npm run test:coverage`

---

## Matriz de trazabilidad

| ID    | Scenario                                                                 | Tipo de test       | Archivo destino                                              | Prioridad | Estado     |
|-------|--------------------------------------------------------------------------|--------------------|--------------------------------------------------------------|-----------|------------|
| SC-01 | Selección rápida de fecha en calendario (cierra modal al tocar día)      | E2E                | `tests/e2e/calendar-picker.spec.ts`                          | Alta      | ⬜ pendiente |
| SC-02 | Vista por defecto (hoy) en panel de citas                              | E2E                | `tests/e2e/appointment-navigation.spec.ts`                     | Alta      | ⬜ pendiente |
| SC-03 | Avanzar a mañana en panel de citas                                       | E2E                | `tests/e2e/appointment-navigation.spec.ts`                     | Alta      | ⬜ pendiente |
| SC-04 | Vista semanal en panel de citas                                         | E2E                | `tests/e2e/appointment-navigation.spec.ts`                     | Alta      | ⬜ pendiente |
| SC-05 | Vista mensual en panel de citas                                         | E2E                | `tests/e2e/appointment-navigation.spec.ts`                     | Alta      | ⬜ pendiente |
| SC-06 | Navegación hacia adelante y atrás (Día/Semana/Mes)                       | E2E                | `tests/e2e/appointment-navigation.spec.ts`                     | Alta      | ⬜ pendiente |
| SC-07 | Cita vencida en estado pendiente → notificación modal                   | E2E                | `tests/e2e/overdue-followup.spec.ts`                         | Alta      | ⬜ pendiente |
| SC-08 | Cita vencida en estado cotizada → notificación modal                    | E2E                | `tests/e2e/overdue-followup.spec.ts`                         | Alta      | ⬜ pendiente |
| SC-09 | Administrador confirma cita vencida desde notificación                | E2E                | `tests/e2e/overdue-followup.spec.ts`                         | Alta      | ⬜ pendiente |
| SC-10 | Administrador rechaza cita vencida desde notificación                 | E2E                | `tests/e2e/overdue-followup.spec.ts`                         | Alta      | ⬜ pendiente |
| SC-11 | Administrador mueve cita vencida desde notificación                   | E2E                | `tests/e2e/overdue-followup.spec.ts`                         | Alta      | ⬜ pendiente |
| SC-12 | Notificación n8n al confirmar cita                                     | Integration + E2E  | `tests/integration/api/appointments.spec.ts` + `tests/e2e/notification-n8n.spec.ts` | Alta      | ⬜ pendiente |
| SC-13 | Guardar y enviar cotización por WhatsApp                              | E2E                | `tests/e2e/quotation-whatsapp.spec.ts`                       | Alta      | ⬜ pendiente |
| SC-14 | Botón de cotización removido tras guardar cotización                  | E2E                | `tests/e2e/quotation-whatsapp.spec.ts`                       | Media     | ⬜ pendiente |
| SC-15 | Rediseño de componente calendario (visual + cierre rápido)             | E2E                | `tests/e2e/calendar-picker.spec.ts`                          | Media     | ⬜ pendiente |
| SC-16 | Manejo de errores: webhook n8n falla pero cita se confirma            | Integration + Unit | `tests/unit/services/notificationService.spec.ts` + `tests/integration/api/appointments.spec.ts` | Alta      | ⬜ pendiente |

---

## Cobertura adicional

| Tipo                | Aplica | Objetivo                                                              | Riesgo cubierto           | Prioridad |
|---------------------|--------|-----------------------------------------------------------------------|---------------------------|-----------|
| Smoke regression    | Sí     | Verificar que el calendario funciona en POS y reservas frontend       | Regresión visual/funcional| Alta      |
| Multitenant isolation| Sí     | Un tenant no ve citas vencidas de otro tenant                         | Seguridad/Aislamiento     | Alta      |
| Result Pattern paths| Sí     | `Ok` y `Err` retornan tipos correctos en servicios de citas y notif.  | Correctness               | Media     |
| Performance         | No     | No es objetivo de esta story                                          | —                         | Baja      |

---

## Datos de prueba

- **Tenant de prueba E2E:** `wondernails`, `centro-tenistico`
- **Usuario:** `jagzao@gmail.com` / `admin`
- **Citas seed:** al menos 1 cita vencida en estado `pendiente` y 1 en estado `cotizada` por tenant
- **Webhook n8n:** URL configurada en variables de entorno de test (puede apuntar a mock server)

---

## Checklist de salida para /quality-runner

- [ ] Todos los SC-XX tienen test correspondiente
- [ ] Tests pasan en headless sin mocks de red (excepto n8n que puede mockearse en E2E si no hay endpoint real)
- [ ] Coverage paths críticos ≥ 80%
- [ ] Smoke regression sin nuevos fallos en calendario de POS y reservas
- [ ] Isolation test: tenant A no ve datos de tenant B en panel de citas vencidas

---

_Última actualización: 2026-06-06_
