# 🗺️ Web Map Report - SaaS Store

**Fecha:** 2026-05-12T20:26:37.631Z
**URL Base:** http://localhost:3003
**Tenant:** wondernails

## 📊 Resumen

| Status              | Cantidad |
| ------------------- | -------- |
| ✅ OK               | 27       |
| 🔀 Redirect (login) | 10       |
| ❌ 404              | 0        |
| ⚠️ Error            | 0        |

## 🔗 Rutas Públicas

| Ruta                           | Status | Estado | Título                                             | Errores consola | Fecha      | Reporte                                        |
| ------------------------------ | ------ | ------ | -------------------------------------------------- | --------------- | ---------- | ---------------------------------------------- |
| /                              | ✅     | ok     | Sass Store                                         | 0               | 2026-05-12 | [Ver](./screenshots/home/REPORT.md)            |
| /t/wondernails                 | ✅     | ok     | Wonder Nails Studio - Premium nail art and manicur | 0               | 2026-05-12 | [Ver](./screenshots/tenant_home/REPORT.md)     |
| /t/wondernails/services        | ✅     | ok     | Sass Store                                         | 3               | 2026-05-12 | [Ver](./screenshots/services/REPORT.md)        |
| /t/wondernails/products        | ✅     | ok     | Sass Store                                         | 0               | 2026-05-12 | [Ver](./screenshots/products/REPORT.md)        |
| /t/wondernails/book            | ✅     | ok     | Sass Store                                         | 0               | 2026-05-12 | [Ver](./screenshots/book/REPORT.md)            |
| /t/wondernails/contact         | ✅     | ok     | Contacto - Wonder Nails Studio                     | 0               | 2026-05-12 | [Ver](./screenshots/contact/REPORT.md)         |
| /t/wondernails/login           | ✅     | ok     | Iniciar Sesión - Wonder Nails Studio               | 0               | 2026-05-12 | [Ver](./screenshots/login/REPORT.md)           |
| /t/wondernails/register        | ✅     | ok     | Sass Store                                         | 0               | 2026-05-12 | [Ver](./screenshots/register/REPORT.md)        |
| /t/wondernails/forgot-password | ✅     | ok     | Sass Store                                         | 0               | 2026-05-12 | [Ver](./screenshots/forgot_password/REPORT.md) |

## 🔒 Rutas Protegidas (logged in)

| Ruta                              | Status | Estado   | URL final                                              | Errores consola | Fecha      | Reporte                                           |
| --------------------------------- | ------ | -------- | ------------------------------------------------------ | --------------- | ---------- | ------------------------------------------------- |
| /t/wondernails/admin              | ✅     | ok       | http://localhost:3003/t/wondernails/admin              | 0               | 2026-05-12 | [Ver](./screenshots/admin_dashboard/REPORT.md)    |
| /t/wondernails/admin/calendar     | ✅     | ok       | http://localhost:3003/t/wondernails/admin/calendar     | 0               | 2026-05-12 | [Ver](./screenshots/admin_calendar/REPORT.md)     |
| /t/wondernails/admin/products     | ✅     | ok       | http://localhost:3003/t/wondernails/admin/products     | 0               | 2026-05-12 | [Ver](./screenshots/admin_products/REPORT.md)     |
| /t/wondernails/admin_services     | 🔀     | redirect | http://localhost:3003/t/wondernails/login              | 0               | 2026-05-12 | [Ver](./screenshots/admin_services/REPORT.md)     |
| /t/wondernails/admin_bookings     | 🔀     | redirect | http://localhost:3003/t/wondernails/login              | 0               | 2026-05-12 | [Ver](./screenshots/admin_bookings/REPORT.md)     |
| /t/wondernails/admin/quotes       | 🔀     | redirect | http://localhost:3003/t/wondernails/login              | 0               | 2026-05-12 | [Ver](./screenshots/admin_quotes/REPORT.md)       |
| /t/wondernails/admin_tenants      | ✅     | ok       | http://localhost:3003/t/wondernails                    | 0               | 2026-05-12 | [Ver](./screenshots/admin_tenants/REPORT.md)      |
| /t/wondernails/pos                | 🔀     | redirect | http://localhost:3003/t/wondernails/login              | 0               | 2026-05-12 | [Ver](./screenshots/pos/REPORT.md)                |
| /t/wondernails/reports            | 🔀     | redirect | http://localhost:3003/t/wondernails/login              | 0               | 2026-05-12 | [Ver](./screenshots/reports/REPORT.md)            |
| /t/wondernails/finance            | 🔀     | redirect | http://localhost:3003/t/wondernails/login              | 0               | 2026-05-12 | [Ver](./screenshots/finance/REPORT.md)            |
| /t/wondernails/finance/movements  | 🔀     | redirect | http://localhost:3003/t/wondernails/login              | 1               | 2026-05-12 | [Ver](./screenshots/finance_movements/REPORT.md)  |
| /t/wondernails/finance/budgets    | ✅     | ok       | http://localhost:3003/t/wondernails/finance/budgets    | 0               | 2026-05-12 | [Ver](./screenshots/finance_budgets/REPORT.md)    |
| /t/wondernails/finance/categories | ✅     | ok       | http://localhost:3003/t/wondernails/finance/categories | 0               | 2026-05-12 | [Ver](./screenshots/finance_categories/REPORT.md) |
| /t/wondernails/inventory          | ✅     | ok       | http://localhost:3003/t/wondernails/inventory          | 9               | 2026-05-12 | [Ver](./screenshots/inventory/REPORT.md)          |
| /t/wondernails/inventory/supplies | ✅     | ok       | http://localhost:3003/t/wondernails/inventory/supplies | 0               | 2026-05-12 | [Ver](./screenshots/inventory_supplies/REPORT.md) |
| /t/wondernails/clientes           | 🔀     | redirect | http://localhost:3003/t/wondernails/login              | 0               | 2026-05-12 | [Ver](./screenshots/clientes/REPORT.md)           |
| /t/wondernails/clientes/nueva     | ✅     | ok       | http://localhost:3003/t/wondernails/clientes/nueva     | 0               | 2026-05-12 | [Ver](./screenshots/nuevo_cliente/REPORT.md)      |
| /t/wondernails/cart               | ✅     | ok       | http://localhost:3003/t/wondernails/cart               | 0               | 2026-05-12 | [Ver](./screenshots/cart/REPORT.md)               |
| /t/wondernails/checkout           | ✅     | ok       | http://localhost:3003/t/wondernails/checkout           | 2               | 2026-05-12 | [Ver](./screenshots/checkout/REPORT.md)           |
| /t/wondernails/orders             | ✅     | ok       | http://localhost:3003/t/wondernails/orders             | 0               | 2026-05-12 | [Ver](./screenshots/orders/REPORT.md)             |
| /t/wondernails/profile            | 🔀     | redirect | http://localhost:3003/t/wondernails/login              | 0               | 2026-05-12 | [Ver](./screenshots/profile/REPORT.md)            |
| /t/wondernails/account            | ✅     | ok       | http://localhost:3003/t/wondernails/account            | 0               | 2026-05-12 | [Ver](./screenshots/account/REPORT.md)            |
| /t/wondernails/settings/calendar  | ✅     | ok       | http://localhost:3003/t/wondernails/settings/calendar  | 0               | 2026-05-12 | [Ver](./screenshots/settings_calendar/REPORT.md)  |
| /t/wondernails/config             | 🔀     | redirect | http://localhost:3003/t/wondernails/login              | 0               | 2026-05-12 | [Ver](./screenshots/config/REPORT.md)             |
| /t/wondernails/favorites          | ✅     | ok       | http://localhost:3003/t/wondernails/favorites          | 0               | 2026-05-12 | [Ver](./screenshots/favorites/REPORT.md)          |
| /t/wondernails/social             | ✅     | ok       | http://localhost:3003/t/wondernails/social             | 0               | 2026-05-12 | [Ver](./screenshots/social/REPORT.md)             |
| /t/wondernails/retouch            | ✅     | ok       | http://localhost:3003/t/wondernails/retouch            | 0               | 2026-05-12 | [Ver](./screenshots/retouch/REPORT.md)            |
| /t/wondernails/reorder            | ✅     | ok       | http://localhost:3003/t/wondernails/reorder            | 0               | 2026-05-12 | [Ver](./screenshots/reorder/REPORT.md)            |

---

_Generado automáticamente por Playwright_
