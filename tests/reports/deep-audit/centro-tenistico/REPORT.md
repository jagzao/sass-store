# 📋 Deep Audit Master Report — Centro Tenístico

**Fecha:** 2026-05-13  
**Tenant:** centro-tenistico  
**URL Base:** http://localhost:3003  
**Credenciales de prueba:** jagzao@gmail.com / admin

## 🎯 Alcance

Auditoria profunda de las 4 páginas clave del tenant:

- 🛒 **/products** — Catálogo de productos
- 💅 **/services** — Catálogo de servicios + reserva
- 📅 **/book** — Agendamiento de citas
- 👤 **/profile** — Perfil de usuario (protegida)

## 📁 Reportes por pantalla

| Pantalla               | Estado | Screenshot                                      | Reporte                                   |
| ---------------------- | ------ | ----------------------------------------------- | ----------------------------------------- |
| book_anon              | ✅     | [Ver](./screenshots/book_anon.png)              | [Ver](./book_anon/REPORT.md)              |
| book_logged            | ✅     | [Ver](./screenshots/book_logged.png)            | [Ver](./book_logged/REPORT.md)            |
| flow_booking           | ✅     | [Ver](./screenshots/flow_booking.png)           | —                                         |
| flow_cart              | ✅     | [Ver](./screenshots/flow_cart.png)              | —                                         |
| flow_checkout          | ✅     | [Ver](./screenshots/flow_checkout.png)          | —                                         |
| products_anon          | ✅     | [Ver](./screenshots/products_anon.png)          | [Ver](./products_anon/REPORT.md)          |
| products_logged        | ✅     | [Ver](./screenshots/products_logged.png)        | [Ver](./products_logged/REPORT.md)        |
| profile_logged         | ✅     | [Ver](./screenshots/profile_logged.png)         | [Ver](./profile_logged/REPORT.md)         |
| profile_password_modal | ✅     | [Ver](./screenshots/profile_password_modal.png) | —                                         |
| profile_redirect_login | ✅     | [Ver](./screenshots/profile_redirect_login.png) | [Ver](./profile_redirect_login/REPORT.md) |
| services_anon          | ✅     | [Ver](./screenshots/services_anon.png)          | [Ver](./services_anon/REPORT.md)          |
| services_logged        | ✅     | [Ver](./screenshots/services_logged.png)        | [Ver](./services_logged/REPORT.md)        |

## 🔐 Auth

- **Anónimo:** /products, /services, /book funcionan públicamente
- **Protegida:** /profile redirige a /login cuando no hay sesión
- **Login:** Credentials (jagzao@gmail.com / admin) funcionan correctamente

## 🌐 Multitenancy

Este reporte cubre el tenant **centro-tenistico**. Para auditoria completa, ejecutar también:

```bash
TEST_TENANT=wondernails npx playwright test tests/e2e/deep-audit-pages.spec.ts
TEST_TENANT=centro-tenistico npx playwright test tests/e2e/deep-audit-pages.spec.ts
```

---

_Generado automáticamente por Playwright Deep Audit_
