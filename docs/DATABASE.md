# Database Specification — Sass Store

## Engine

PostgreSQL (hosted in Supabase) via Drizzle ORM.

## Schema Location

- `apps/web/lib/db/schema.ts` — Prisma-to-Drizzle legacy tables
- `packages/database/schema.ts` — Master schema with extended tables
- `packages/database/video-processing-schema.ts` — Video metadata

## Core Tables

| Table                     | Purpose                     | tenant_id | RLS                       |
| ------------------------- | --------------------------- | --------- | ------------------------- |
| `tenants`                 | Tenant registry             | self      | no                        |
| `tenant_configs`          | Key/value config per tenant | yes       | partial                   |
| `products`                | Product catalog             | yes       | yes                       |
| `services`                | Service catalog             | yes       | yes                       |
| `staff`                   | Staff members               | yes       | yes                       |
| `orders`                  | Purchase/booking orders     | yes       | yes                       |
| `order_items`             | Line items                  | yes       | yes                       |
| `payments`                | Payment records             | yes       | yes                       |
| `customers`               | CRM contacts                | yes       | yes                       |
| `customer_visits`         | Visit history               | yes       | yes                       |
| `bookings`                | Reservations/appointments   | yes       | yes                       |
| `quotes`                  | Service quotes              | yes       | yes                       |
| `quote_items`             | Quote line items            | yes       | yes                       |
| `inventory`               | Stock levels                | yes       | yes                       |
| `inventory_locations`     | Warehouses/stores           | yes       | yes                       |
| `inventory_movements`     | Stock in/out                | yes       | yes                       |
| `inventory_transactions`  | Transaction log             | yes       | yes                       |
| `finance_movements`       | Income/expense              | yes       | yes                       |
| `finance_budgets`         | Budget tracking             | yes       | yes                       |
| `finance_pos_terminals`   | POS terminals               | yes       | yes                       |
| `finance_kpis`            | KPI snapshots               | yes       | yes                       |
| `social_posts`            | Planned posts               | yes       | yes                       |
| `social_post_targets`     | Post channel links          | yes       | yes                       |
| `social_content_library`  | Reusable content            | yes       | yes                       |
| `media_assets`            | Media uploads               | yes       | yes                       |
| `users`                   | App users                   | no        | yes (per tenant via join) |
| `accounts`                | OAuth accounts              | no        | yes                       |
| `sessions`                | Auth sessions               | no        | no                        |
| `verification_tokens`     | Email/auth tokens           | no        | no                        |
| `api_keys`                | Tenant API keys             | yes       | no                        |
| `audit_logs`              | Audit trail                 | yes       | no                        |
| `retouch_configs`         | Retouch settings            | yes       | yes                       |
| `retouch_holidays`        | Retouch blackout days       | yes       | yes                       |
| `campaigns`               | Marketing campaigns         | yes       | yes                       |
| `scheduled_notifications` | Scheduled messages          | yes       | yes                       |
| `budget_categories`       | Budget classification       | yes       | yes                       |
| `transaction_categories`  | Transaction tags            | yes       | yes                       |
| `channel_accounts`        | Social channel creds        | yes       | yes                       |
| `channel_credentials`     | OAuth tokens                | yes       | yes                       |

## Indexes Strategy

- Unique composite indexes on `tenant_id + slug/sku/email` for deduplication.
- Single indexes on `tenant_id` for RLS query optimization.
- JSONB GIN indexes where applicable on metadata columns.

## RLS Policies

Implemented via `apps/web/lib/db/schema.ts` and `packages/database/rls-helper.ts`.
Patterns:

- `USING (tenant_id = current_setting('app.current_tenant')::uuid)`
- Admin override with `bypass_rls` role.

## Connections

- Pooler: `max=3` (documented).
- Migrations: Drizzle Kit (`drizzle-kit push`).

---

_Actualizado: 2026-05-31 — Ver schema master en `packages/database/schema.ts`._
