# TODOS - Desarrollo, Bugs y Deuda Técnica

Este documento centraliza pendientes activos del proyecto: features, bugs, deuda técnica y mejoras operativas.

## Cómo usar este archivo

- Registrar cada pendiente como checkbox (`- [ ]`).
- Mover a **En progreso** cuando se esté trabajando (`- [-]`).
- Marcar como completado (`- [x]`) al cerrar con evidencia (PR, commit, test, captura).
- Prioridad sugerida: **P0** (crítico), **P1** (alto), **P2** (medio), **P3** (bajo).

---

## En progreso

- [-] **P1 | Frontend/Auth** Evitar errores ruidosos en login por endpoints financieros (`/api/finance/*`) cuando no hay sesión
  - Contexto: en login aparecía `Failed to fetch KPIs` por `401/403`.
  - Estado: mitigado en cliente, pendiente validación completa en escenarios multi-tenant.

---

## Backlog de bugs

- [ ] **P1 | Tenant/Middleware** Reducir `Unknown host 'localhost:3001' using fallback tenant 'zo-system'`
  - Impacto: ruido en logs y posible confusión en resolución de tenant.
- [ ] **P1 | Tenant Validation** Corregir flujo que produce `Missing x-tenant header`
  - Impacto: requests inválidos/reintentados y ruido operativo.
- [ ] **P2 | Assets** Resolver 404 de logos (`/logos/delirios.png`, `/logos/vigistudio.png`, `/logos/nom-nom.png`, etc.)
  - Impacto: branding incompleto en UI.

---

## Deuda técnica

- [ ] **P1 | Observabilidad** Estandarizar logs por dominio (tenant/auth/cart/finance) con niveles `info/warn/error` y contexto mínimo
- [ ] **P1 | Frontend Performance** Revisar polling/re-fetch frecuente de sesión + carrito (`/api/auth/session`, `PUT /api/users/*/cart`)
  - Objetivo: disminuir tráfico repetitivo y carga de servidor.
- [ ] **P2 | Error Handling** Homogeneizar manejo de errores de red en hooks del frontend
  - Objetivo: mensajes útiles al usuario + reducción de errores de consola no accionables.
- [ ] **P2 | Documentation** Definir política de triage de incidentes y SLA interno para bugs recurrentes.

---

## Mejoras funcionales pendientes

- [ ] **P2 | Finance** Validar integración completa de reportes y exportaciones (PDF/Excel) por tenant
- [ ] **P2 | POS** Reforzar manejo de errores y mensajes de UX en procesamiento de ventas
- [ ] **P3 | UX** Crear vista de estado operativo (health panel) para errores de tenant, assets y auth.

---

## Completados recientes

- [x] **Frontend/Finance** Se evitó excepción en cliente para `401/403` en KPIs/movimientos durante flujo sin sesión.

---

## Plantilla para nuevos pendientes

```md
- [ ] **P2 | Área** Título corto del pendiente
  - Contexto:
  - Impacto:
  - Criterio de aceptación:
  - Referencias: issue/PR/archivo
```

---

## Convenciones rápidas

- **Bug**: algo que debería funcionar y falla.
- **Deuda técnica**: decisiones o implementaciones que funcionan, pero encarecen mantenimiento/evolución.
- **Mejora**: no es bug, pero incrementa calidad, rendimiento o DX/UX.
