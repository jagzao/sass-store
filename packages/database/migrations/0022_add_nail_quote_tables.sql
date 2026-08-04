-- STRY-032: Nail quote catalog, quotes, lines and booking deposits
-- Base prices stored in cents (e.g. 52000 = $520.00)

CREATE TABLE IF NOT EXISTS "nail_quote_options" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id"),
  "category" varchar(20) NOT NULL,
  "key" varchar(50) NOT NULL,
  "label" varchar(100) NOT NULL,
  "base_price" integer NOT NULL DEFAULT 0,
  "base_duration_minutes" integer NOT NULL DEFAULT 0,
  "image_url" text,
  "order" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "metadata" jsonb DEFAULT '{}',
  "created_at" timestamp DEFAULT NOW(),
  "updated_at" timestamp DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "nail_quote_options_tenant_category_key_idx"
  ON "nail_quote_options"("tenant_id", "category", "key");
CREATE INDEX IF NOT EXISTS "nail_quote_options_tenant_idx"
  ON "nail_quote_options"("tenant_id");
CREATE INDEX IF NOT EXISTS "nail_quote_options_category_idx"
  ON "nail_quote_options"("category");

CREATE TABLE IF NOT EXISTS "nail_quotes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id"),
  "customer_id" uuid REFERENCES "customers"("id"),
  "customer_name" varchar(200),
  "customer_phone" varchar(20),
  "total_amount" decimal(10,2) NOT NULL,
  "duration_minutes" integer NOT NULL DEFAULT 0,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "source" varchar(30) NOT NULL DEFAULT 'nail_quoter',
  "idempotency_key" varchar(255),
  "metadata" jsonb DEFAULT '{}',
  "created_at" timestamp DEFAULT NOW(),
  "updated_at" timestamp DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "nail_quotes_tenant_idx" ON "nail_quotes"("tenant_id");
CREATE INDEX IF NOT EXISTS "nail_quotes_customer_idx" ON "nail_quotes"("customer_id");
CREATE INDEX IF NOT EXISTS "nail_quotes_status_idx" ON "nail_quotes"("status");
CREATE INDEX IF NOT EXISTS "nail_quotes_idempotency_idx"
  ON "nail_quotes"("tenant_id", "idempotency_key");

CREATE TABLE IF NOT EXISTS "nail_quote_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "quote_id" uuid NOT NULL REFERENCES "nail_quotes"("id") ON DELETE CASCADE,
  "option_id" uuid NOT NULL REFERENCES "nail_quote_options"("id"),
  "category" varchar(20) NOT NULL,
  "key" varchar(50) NOT NULL,
  "label" varchar(100) NOT NULL,
  "unit_price" decimal(10,2) NOT NULL,
  "duration_minutes" integer NOT NULL DEFAULT 0,
  "order" integer NOT NULL DEFAULT 0,
  "metadata" jsonb DEFAULT '{}',
  "created_at" timestamp DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "nail_quote_lines_quote_idx" ON "nail_quote_lines"("quote_id");
CREATE INDEX IF NOT EXISTS "nail_quote_lines_option_idx" ON "nail_quote_lines"("option_id");

CREATE TABLE IF NOT EXISTS "booking_deposits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id"),
  "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
  "amount" decimal(10,2) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "due_at" timestamp,
  "paid_at" timestamp,
  "metadata" jsonb DEFAULT '{}',
  "created_at" timestamp DEFAULT NOW(),
  "updated_at" timestamp DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "booking_deposits_tenant_idx" ON "booking_deposits"("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "booking_deposits_booking_idx" ON "booking_deposits"("booking_id");
CREATE INDEX IF NOT EXISTS "booking_deposits_status_idx" ON "booking_deposits"("status");

-- ponytail: RLS policies deferred; run npm run rls:apply before production.
