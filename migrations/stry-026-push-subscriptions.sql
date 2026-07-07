-- STRY-026 — Web Push subscriptions table (surgical migration).
-- Applies ONLY the push_subscriptions table. Does NOT touch pre-existing schema drift.
-- Apply with:  psql "$DATABASE_URL" -f migrations/stry-026-push-subscriptions.sql
--   or paste into the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "endpoint" text NOT NULL,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "user_agent" text,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "push_subscriptions_tenant_idx"
  ON "push_subscriptions" ("tenant_id");

CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_endpoint_idx"
  ON "push_subscriptions" ("endpoint");
