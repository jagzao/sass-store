# PM Implementation Summary - Sass Store

> Última actualización: 2026-04-27 | Estado: VIGENTE | Dueño: Product Manager (PM) Agent
> Inventario de features, roadmap de tenants, bugs activos y métricas de producto. Fuente de verdad para scope y priorización.

---

## 1. Misión del PM

Definir el **qué** y el **por qué** del producto, asegurar que cada feature tenga:

- Requisitos funcionales claros y medibles.
- Criterios de aceptación con tests E2E definidos.
- Impacto estimado en usuarios activos y revenue.
- Consideración de deuda técnica relacionada.

**Mandato:** Ningún feature inicia desarrollo sin una historia con los criterios de aceptación y los tests E2E planificados.

---

## 2. Features Entregadas (Production Ready)

### Core Platform

| # | Feature | Descripción | Tenant Impact | Tests E2E | Estado |
|---|---------|-------------|---------------|-----------|-------- |
| 1 | **Aislamiento Multitenant** | Cada tenant opera de forma aislada; datos, sesiones, carrito separados | Todos | ✅ `tests/e2e/multitenant/` | ✅ Vivo |
| 2 | **Auth (Google OAuth + Credentials)** | Login/Register con NextAuth v5; roles Admin/Staff/Cliente | Todos | ✅ `tests/e2e/auth/` | ✅ Vivo |
| 3 | **Resolución de Tenant** | Header `X-Tenant`, subdomain, path param, cookie, fallback `zo-system` | Todos | ✅ `tests/e2e/fallback/` | ✅ Vivo |
| 4 | **RLS (Row-Level Security)** | AislamientoDB por `tenant_id` con políticas | Todos | ✅ `tests/integration/api/tenant-api.spec.ts` | ✅ Vivo |
| 5 | **Media Pipeline** | Upload, optimización AVIF/WebP, variantes, blurhash, dedup | Todos | ✅ `tests/e2e/media-pipeline/` | ✅ Vivo |
| 6 | **Quotas / Cost Guards** | Eco (50%), Warning (80%), Freeze (90%), Kill (100%) | Todos | ✅ `tests/e2e/quotas/` | ✅ Vivo |
| 7 | **SEO / Performance / A11y** | Metas por tenant, LCP/INP/CLS budgets, contraste AA | Todos | ✅ `tests/e2e/{seo,accessibility,performance}/` | ✅ Vivo |

### Finance Module

| # | Feature | Descripción | Tests E2E | Estado |
|---|---------|-------------|-----------|-------- |
| 8 | **Financial Dashboard** | KPIs, gráficos de ingresos/gastos, comparativas | ✅ `tests/e2e/finance/dashboard.spec.ts` | ✅ Vivo |
| 9 | **Financial Matrix** | Matriz configurable (dimensiones x métricas), granularity | ✅ `tests/e2e/finance/matrix/` | ✅ Vivo |
| 10 | **Budgets** | Presupuestos por categoría y alertas | ✅ `tests/e2e/finance/budgets.spec.ts` | ✅ Vivo |
| 11 | **Categories** | CRUD de categorías de transacción | ✅ `tests/e2e/finance/categories.spec.ts` | ✅ Vivo |
| 12 | **Movements** | Ingresos y egresos con adjuntos | ✅ `tests/e2e/finance/` | ✅ Vivo |
| 13 | **POS (Punto de Venta)** | Venta rápida con productos/servicios, cierre de turno, Result Pattern | `tests/e2e/pos/`, `tests/unit/services/POSService.spec.ts` | 🔄 En progreso | Servicio + API con Result Pattern. Falta E2E completo con auth |

### Booking & Services

| # | Feature | Descripción | Tests E2E | Estado |
|---|---------|-------------|-----------|-------- |
| 14 | **Booking Engine** | Reservas por slot con calendario interactivo | ✅ `tests/e2e/calendar.spec.ts` | ✅ Vivo |
| 15 | **Service Catalog** | CRUD de servicios con duración, precio, imagen | ✅ `tests/e2e/admin/services.spec.ts` | ✅ Vivo |
| 16 | **Staff Management** | Asignación de servicios a staff, horarios | ⚠️ Parcial | 🔄 Beta |
| 17 | **Customer CRM** | Fichas de cliente, historial de visitas, cumpleaños | ✅ `tests/e2e/customers/` | ✅ Vivo |
| 18 | **Retouch System** | Cálculo de fechas de retoque configurables | ⚠️ Sin E2E | ⛔ Backlog |

### E-commerce

| # | Feature | Descripción | Tests E2E | Estado |
|---|---------|-------------|-----------|-------- |
| 19 | **Product Catalog** | CRUD de productos, categorías, inventario | ✅ `tests/e2e/admin/` | ✅ Vivo |
| 20 | **Cart / Checkout** | Carrito por tenant, flujo de compra | ✅ `tests/e2e/cart/` | ✅ Vivo |
| 21 | **Payments (Stripe + MercadoPago)** | Cobros online y en POS | ✅ `tests/e2e/payments/` | ✅ Vivo |
| 22 | **Inventory Management** | Stock, movimientos, alertas, deducciones automáticas | ⚠️ Parcial (sin E2E de deducciones) | 🔄 Beta |

### Social & Marketing

| # | Feature | Descripción | Tests E2E | Estado |
|---|---------|-------------|-----------|-------- |
| 23 | **Social Planner** | Crear, programar, duplicar posts; vistas Mes/Semana/Día/Año | ✅ `tests/e2e/social-planner/` | ✅ Vivo |
| 24 | **Social Media Library** | Galería de assets reutilizables | ⚠️ Básico | 🔄 Beta |
| 25 | **Auto-poster** | Publicación automática a redes (queue) | ⚠️ Básico | 🔄 Beta |

### Admin & Utilities

| # | Feature | Descripción | Tests E2E | Estado |
|---|---------|-------------|-----------|-------- |
| 26 | **Admin Dashboard** | KPIs, gráficos, acciones rápidas | ✅ `tests/e2e/dashboard/` | ✅ Vivo |
| 27 | **Menu Designer** | Diseño visual de menú de servicios | ✅ `tests/e2e/menu/` | ✅ Vivo |
| 28 | **Email Notifications** | Confirmaciones de reserva, recordatorios | ⚠️ Sin E2E de contenido | 🔄 Beta |

---

## 3. Features en Progreso (Sprint Actual)

| # | Feature | Owner | Progreso | Bloqueador |
|---|---------|-------|----------|------------|
| 1 | POS robusto con manejo de errores UX | Dev Team | 60% | Falta testing E2E completo |
| 2 | Retouch System — fechas configurables por servicio | Dev Team | 40% | Depende de refactor de `lib/db/` |
| 3 | Inventory auto-deduction en POS | Dev Team | 30% | Diseño de transacciones concurrentes |
| 4 | Health Panel operativo (errores tenant/assets/auth) | Dev Team | 20% | Prioridad cambió a POS |

---

## 4. Backlog de Producto (Priorizado)

### P0 — Crítico (Próximo Sprint)

- [ ] POS completo con flujo de caja, cierre de turno, reportes diarios
- [ ] Retouch System — E2E + validación completa
- [ ] Inventory auto-deduction: productos vinculados a servicios en POS

### P1 — Alto (2-3 Sprints)

- [ ] Reportes PDF/Excel exportables por tenant en Finance
- [ ] Notificaciones push/WhatsApp para recordatorios de reserva
- [ ] Sistema de reseñas y calificaciones por cliente
- [ ] Loyalty / sistema de puntos por compra

### P2 — Medio (Backlog)

- [ ] Integración completa con Google Calendar (2-way sync)
- [ ] Analytics avanzado por tenant (cohortes, LTV, CAC)
- [ ] Onboarding wizard para nuevos tenants
- [ ] Multi-sucursal por tenant (si un negocio tiene 2+ locales)

### P3 — Bajo (Futuro)

- [ ] App móvil nativa (PWA ya soportada)
- [ ] Marketplace de templates de branding
- [ ] AI suggestions para social media captions
- [ ] Traducción multi-idioma del storefront

---

## 5. Bugs Activos (Seguimiento PM)

Origen: `TODOS.md` + feedback de tenants.

| # | Bug | Severidad | Tenant Impact | Estado | Owner |
|---|-----|-----------|---------------|--------|-------|
| 1 | `Unknown host 'localhost:3001'` ruido en logs | P1 | Todos (dev/staging) | 🔄 En progreso | Dev Leader |
| 2 | `Missing x-tenant header` en requests inválidos | P1 | Todos (API clients mal configurados) | 🔄 En progreso | Dev Leader |
| 3 | 404 de logos (`/logos/*.png`) en tenants nuevos | P2 | Branding incompleto | 📋 Backlog | Dev |
| 4 | Errores ruidosos `Failed to fetch KPIs` en login sin sesión | P1 | Todos | ✅ Mitigado | Dev |
| 5 | Polling excesivo de sesión + carrito | P2 | Performance general | 📋 Backlog | Dev |

---

## 6. Impacto por Tenant (Catálogo de Clientes)

| Tenant | Tipo | Features Activas | Features Faltantes | Satisfacción Estimada |
|--------|------|------------------|--------------------|----------------------- |
| **wondernails** | Booking | Booking, Services, CRM, Finance | POS, Retouch | ⭐⭐⭐⭐ |
| **vigistudio** | Booking | Booking, Services, CRM, Finance | POS, Retouch | ⭐⭐⭐⭐ |
| **villafuerte** | Booking | Booking, Services, CRM | Finance completo, POS | ⭐⭐⭐ |
| **vainilla-vargas** | Catálogo | Catalog, Cart, Payments, CRM | Booking, POS | ⭐⭐⭐⭐ |
| **delirios** | Catálogo | Catalog, Cart, Payments, CRM | Booking, POS | ⭐⭐⭐⭐ |
| **nom-nom** | Catálogo | Catalog, Cart, Payments, CRM | Booking, POS | ⭐⭐⭐ |
| **zo-system** | Default/Fallback | Public catalog, Auth, Landing | Admin features | N/A |

---

## 7. Métricas de Producto (KPIs)

| Métrica | Target | Actual (Estimado) | Tendencia |
|---------|--------|---------------------|-----------|
| Nuevos tenants / mes | 5 | 2-3 | ⬆️ Creciente |
| Active users / tenant (MAU) | 200 | 80-150 | ➡️ Estable |
| Reservas completadas / mes | 500 | 300 | ⬆️ Creciente |
| Transacciones POS / mes | 300 | 50 (beta) | ⬆️ Lanzamiento reciente |
| Churn rate ( tenant cancelación ) | < 5% / mes | < 3% | ✅ Saludable |
| Feature adoption (Social Planner) | 60% de tenants | 30% | ⬆️ Creciente |
| NPS (Net Promoter Score) | > 50 | No medido | 📋 Backlog |

---

## 8. Dependencias entre Features (Mapa de Bloqueos)

```
POS Robusto
├── → Inventory auto-deduction (bloqueado por diseño de transacciones)
├── → Finance: cierre de caja diario (bloqueado por granularidad de movimientos)
└── → Retouch: productos vendidos en POS disparan fechas de retoque

Retouch System
├── → Service CRUD (prerequisite: OK)
├── → Booking engine (prerequisite: OK)
└── → POS (optional: productos también disparan retoque)

Multi-sucursal
├── → RLS refactor (prerequisite: debe soportar branch/location_id)
└── → Inventory refactor (prerequisite: stock por sucursal)
```

---

## 9. Checklist del PM (Antes de Aprobar un Feature para Desarrollo)

- [ ] **Historia clara:** ¿Se entiende el problema del usuario y la solución propuesta?
- [ ] **Criterios de aceptación:** ¿Están escritos y son verificables (preferiblemente con tests E2E)?
- [ ] **Mockups / Wireframes:** ¿Hay diseño aprobado en `design/wireframes/` si hay UI?
- [ ] **Impacto técnico:** ¿El Architect evaluó si deuda técnica afecta el timeline?
- [ ] **Tests E2E planificados:** ¿Se identificaron los flujos de usuario a testear?
- [ ] **Rollout plan:** ¿Se define si es feature flag, beta por tenant, o general?
- [ ] **Métrica de éxito:** ¿Cómo se sabe que el feature funcionó? (adoption, CSAT, revenue)
- [ ] **Documentación:** ¿Se actualiza este PM Summary y `AGENTS.md` con el nuevo flujo?
- [ ] **Comunicación al equipo:** ¿QA Leader conoce los casos de prueba prioritarios?

---

## 10. Registro de Releases

| Versión | Fecha | Features Incluidas | Bugs Fixes | Notas |
|---------|-------|--------------------|------------|-------|
| v1.4.0 | 2026-04-15 | Social Planner v1, Media Pipeline v2 | Fix auth 401 en login | Stable |
| v1.3.0 | 2026-03-20 | Finance Matrix, Budgets, Categories | Fix RLS en products API | Stable |
| v1.2.0 | 2026-02-10 | Quotas/Cost Guards, Tenant fallback | Fix booking conflict race | Stable |
| v1.1.0 | 2026-01-15 | POS beta, Inventory alerts | Fix cart tenant isolation | Beta |
| v1.0.0 | 2025-12-01 | Booking, Services, Catalog, Auth MVP | — | Stable |

---

**🔥 Este documento guía la priorización de producto. Todo cambio de scope o timeline debe reflejarse aquí y comunicarse al Architect y Dev Leader antes de ejecutar.**
