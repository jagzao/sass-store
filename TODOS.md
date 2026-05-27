# TODOS - Desarrollo, Bugs y Deuda Técnica

Este documento centraliza pendientes activos del proyecto: features, bugs, deuda técnica y mejoras operativas.

## Cómo usar este archivo

- Registrar cada pendiente como checkbox (`- [ ]`).
- Mover a **En progreso** cuando se esté trabajando (`- [-]`).
- Marcar como completado (`- [x]`) al cerrar con evidencia (PR, commit, test, captura).
- Prioridad sugerida: **P0** (crítico), **P1** (alto), **P2** (medio), **P3** (bajo).

---

## En progreso

- [-] **P1 | System** Migrar proyecto a User Stories + Orquestador autónomo
  - Contexto: necesitamos completar autonomía del workflow como fábrica de software.
  - Estado: estructura creada (BACKLOG.md, \_template.md, story-orchestrator.md), pending validación completa.
- [-] **P1 | Frontend/Auth** Evitar errores ruidosos en login por endpoints financieros (`/api/finance/*`) cuando no hay sesión
  - Contexto: en login aparecía `Failed to fetch KPIs` por `401/403`.
  - Estado: mitigado en cliente, pendiente validación completa en escenarios multi-tenant.

---

## Backlog de bugs

- [x] **P1 | Tenant/Middleware** Reducir `Unknown host 'localhost:3001' using fallback tenant 'zo-system'`
  - Fix: commit `939e9fc` — suprime log en dev para hosts localhost; solo loggea en producción o hosts externos.
- [x] **P1 | Tenant Validation** Corregir flujo que produce `Missing x-tenant header`
  - Fix: commit `939e9fc` — middleware usa `NextResponse.next({ request: { headers } })` para forward tenant headers a Server Components y API Routes.
- [x] **P2 | Assets** Resolver 404 de logos (`/logos/delirios.png`, `/logos/vigistudio.png`, `/logos/nom-nom.png`, etc.)
  - Fix: commit `76488aa` — SVG logos añadidos para delirios/manada-juma/zo-system; get-tenant.ts remapea placeholder.zo.dev → /tenants/[slug]/logo/logo.svg; resolver.ts y tenant-provider.tsx usan rutas locales.

---

## Deuda técnica

- [x] **P1 | Observabilidad** Estandarizar logs por dominio (tenant/auth/cart/finance) con niveles `info/warn/error` y contexto mínimo
  - Fix: commit `752541e` — DomainLogger con tenantLogger/authLogger/cartLogger/financeLogger/dbLogger/apiLogger; prod=warn+, dev=info+; dedup 10s; LOG_LEVEL_TENANT=debug para override
- [x] **P1 | Frontend Performance** Revisar polling/re-fetch frecuente de sesión + carrito (`/api/auth/session`, `PUT /api/users/*/cart`)
  - Fix: commit `dd2d4bb` — CartSyncProvider: polling de 30s → debounce de 5s en cambios de items; loadUserCart/saveCartToUser reciben userId de useSession (sin fetch extra de /api/auth/session); SessionProvider: refetchInterval=0 (sin polling de sesión); beforeunload via sendBeacon.
- [x] **P2 | Error Handling** Homogeneizar manejo de errores de red en hooks del frontend
  - Fix: commit `09b7fba` — POS/Reports/Movements: alert() → toast (sonner); console.error → financeLogger; use-finance.ts: todos los console.error/warn → financeLogger. API calls ahora incluyen tenant param obligatorio.
- [x] **P2 | Documentation** Definir política de triage de incidentes y SLA interno para bugs recurrentes.
  - Fix: commit `3996962` — `docs/INCIDENT_TRIAGE.md`: tabla P0-P3 SLA, árbol de diagnóstico, runbooks por área (auth/tenant/finance/logos/Ollama/n8n), escalación y template post-mortem.

---

## Mejoras funcionales pendientes

- [x] **P2 | Finance** Validar integración completa de reportes y exportaciones (PDF/Excel) por tenant
  - Fix: commit `09b7fba` — agrega `tenant=tenantSlug` en API calls (era 400); transforma respuesta de API a SalesReport/ProductsReport; exportReport() ahora genera CSV client-side (Excel) + window.print() (PDF), sin dependencias externas.
- [x] **P2 | POS** Reforzar manejo de errores y mensajes de UX en procesamiento de ventas
  - Fix: commit `09b7fba` — agrega `tenantSlug` al body del POST (era 400); toast.success/error reemplazan alert(); financeLogger.error reemplaza console.error.
- [x] **P3 | UX** Crear vista de estado operativo (health panel) para errores de tenant, assets y auth.
  - Fix: commit `3996962` — /api/system/status (DB + Ollama + n8n, auth protegido); StatusPanel client component con auto-refresh 60s y skeletons; integrado en admin dashboard.

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
