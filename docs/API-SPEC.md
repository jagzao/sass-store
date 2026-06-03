# API Specification — Sass Store

## Version

Current: v1 (App Router `app/api/**`)

---

## Authentication

All API routes (except `/api/v1/public/**`, health and debug) require a valid session via NextAuth or a valid API key header (`x-api-key`).

---

## Multitenancy

Tenant resolution:

- Path-based: `/api/tenants/{tenantSlug}/...` or via tenant slug in Next.js route params.
- Header fallback: `x-tenant` (legacy, limited use).
- Context injection: `tenantId` extracted and validated in route handlers.

---

## Public Endpoints

| Method | Path                      | Purpose                       |
| ------ | ------------------------- | ----------------------------- |
| GET    | `/api/health`             | Health check                  |
| GET    | `/api/system/status`      | System status                 |
| GET    | `/api/system/quality`     | Quality OS score and findings |
| GET    | `/api/v1/public/products` | Public product catalog        |
| GET    | `/api/v1/public/services` | Public service catalog        |
| POST   | `/api/auth/register`      | User registration             |
| POST   | `/api/auth/[...nextauth]` | Auth.js sessions              |

## Tenant-scoped Endpoints

| Method   | Path                                                   | Purpose         |
| -------- | ------------------------------------------------------ | --------------- |
| GET/POST | `/api/tenants/{tenant}/products`                       | CRUD products   |
| GET/POST | `/api/tenants/{tenant}/services`                       | CRUD services   |
| GET/POST | `/api/tenants/{tenant}/bookings`                       | Bookings        |
| GET/POST | `/api/tenants/{tenant}/customers`                      | Customers       |
| GET/POST | `/api/tenants/{tenant}/quotes`                         | Quotes          |
| POST     | `/api/tenants/{tenant}/bookings/{id}/convert-to-visit` | Convert booking |

## Finance Endpoints

| Method   | Path                            | Purpose             |
| -------- | ------------------------------- | ------------------- |
| GET/POST | `/api/finance/movements`        | Financial movements |
| GET/POST | `/api/finance/budgets`          | Budgets             |
| GET/POST | `/api/finance/kpis`             | Financial KPIs      |
| GET/POST | `/api/finance/pos/terminals`    | POS terminals       |
| GET/POST | `/api/finance/pos/sales`        | POS sales           |
| GET/POST | `/api/finance/reports/sales`    | Sales reports       |
| GET/POST | `/api/finance/reports/products` | Product reports     |
| POST     | `/api/finance/matrix`           | Financial matrix    |

## Inventory Endpoints

| Method   | Path                       | Purpose            |
| -------- | -------------------------- | ------------------ |
| GET/POST | `/api/inventory`           | Inventory products |
| GET/POST | `/api/inventory/locations` | Locations          |
| GET/POST | `/api/inventory/movements` | Stock movements    |
| GET/POST | `/api/inventory/transfers` | Transfers          |
| GET/POST | `/api/inventory/suppliers` | Suppliers          |
| GET/POST | `/api/inventory/alerts`    | Alerts             |
| GET/POST | `/api/inventory/reports`   | Reports            |

## Social / Content Endpoints

| Method   | Path                          | Purpose               |
| -------- | ----------------------------- | --------------------- |
| GET/POST | `/api/v1/social/library`      | Content library       |
| GET/POST | `/api/v1/social/generate`     | AI content generation |
| GET/POST | `/api/v1/social/queue`        | Post queue            |
| GET/POST | `/api/v1/social/calendar`     | Calendar posts        |
| GET/POST | `/api/v1/social/analytics`    | Analytics             |
| POST     | `/api/smart-publish/generate` | Smart publish         |
| POST     | `/api/smart-publish/save`     | Save publish          |

## Diagnostic / Debug Endpoints

| Method | Path                            | Purpose           |
| ------ | ------------------------------- | ----------------- |
| GET    | `/api/diagnose`                 | General diagnosis |
| GET    | `/api/diagnose/db`              | DB check          |
| GET    | `/api/diagnose/schema`          | Schema dump       |
| GET    | `/api/diagnose/auth`            | Auth check        |
| GET    | `/api/diagnose/ping`            | Ping              |
| GET    | `/api/diagnose/connection-test` | Connection test   |

## Response Format

Standard response envelope (Result Pattern):

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Error response:

```json
{
  "success": false,
  "data": null,
  "error": {
    "type": "ValidationError",
    "message": "...",
    "context": { ... }
  }
}
```

## Rate Limits

- Public endpoints: 100 req/min por IP.
- Tenant-scoped: 1000 req/min por tenant.
- AI generation: 10 req/min por usuario.

---

_Actualizado: 2026-05-31 — Mapeo completo en `apps/web/app/api/**`._
