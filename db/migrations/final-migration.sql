-- ========================================
-- SASS STORE - Complete Database Migration
-- Clean version without conflicts
-- ========================================

CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" varchar(255),
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(255),
	"changes" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"staff_id" uuid,
	"customer_name" varchar(100) NOT NULL,
	"customer_email" varchar(255),
	"customer_phone" varchar(20),
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"total_price" numeric(10, 2) NOT NULL,
	"google_event_id" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"asset_type" varchar(50) NOT NULL,
	"entity_id" varchar(100),
	"filename" varchar(255) NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"original_size" bigint NOT NULL,
	"total_size" bigint NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"width" integer,
	"height" integer,
	"dominant_color" varchar(7),
	"blurhash" varchar(255),
	"variants" jsonb NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "media_assets_content_hash_unique" UNIQUE("content_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"sku" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"category" varchar(50) NOT NULL,
	"featured" boolean DEFAULT false,
	"active" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"duration" integer NOT NULL,
	"featured" boolean DEFAULT false,
	"active" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"role" varchar(50) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"specialties" jsonb DEFAULT '[]' NOT NULL,
	"photo" text,
	"google_calendar_id" varchar(255),
	"active" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenant_quotas" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"storage_used_bytes" bigint DEFAULT 0,
	"storage_limit_bytes" bigint DEFAULT 5368709120,
	"media_count" integer DEFAULT 0,
	"media_limit" integer DEFAULT 1000,
	"bandwidth_used_bytes" bigint DEFAULT 0,
	"bandwidth_limit_bytes" bigint DEFAULT 53687091200,
	"reset_date" date DEFAULT '2025-10-23',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"mode" varchar(20) DEFAULT 'catalog' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"branding" jsonb NOT NULL,
	"contact" jsonb NOT NULL,
	"location" jsonb NOT NULL,
	"quotas" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_tenant_idx" ON "audit_logs" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_action_idx" ON "audit_logs" ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_created_idx" ON "audit_logs" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_tenant_idx" ON "bookings" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_service_idx" ON "bookings" ("service_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_staff_idx" ON "bookings" ("staff_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_time_idx" ON "bookings" ("start_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_status_idx" ON "bookings" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_tenant_type_idx" ON "media_assets" ("tenant_id","asset_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_entity_idx" ON "media_assets" ("tenant_id","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "media_hash_idx" ON "media_assets" ("content_hash");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_tenant_sku_idx" ON "products" ("tenant_id","sku");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_tenant_idx" ON "products" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_category_idx" ON "products" ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_featured_idx" ON "products" ("featured");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_tenant_idx" ON "services" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_featured_idx" ON "services" ("featured");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "staff_tenant_idx" ON "staff" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "staff_email_idx" ON "staff" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_slug_idx" ON "tenants" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenant_status_idx" ON "tenants" ("status");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "services" ADD CONSTRAINT "services_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff" ADD CONSTRAINT "staff_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tenant_quotas" ADD CONSTRAINT "tenant_quotas_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
CREATE TABLE IF NOT EXISTS "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"name" varchar(200) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_number" varchar(100) NOT NULL,
	"customer_name" varchar(100) NOT NULL,
	"customer_email" varchar(255),
	"customer_phone" varchar(20),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"type" varchar(20) DEFAULT 'purchase' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'MXN' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"stripe_payment_intent_id" varchar(255),
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'MXN' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"user_id" text,
	"customer_name" varchar(100) NOT NULL,
	"customer_email" varchar(255),
	"rating" integer NOT NULL,
	"title" varchar(200),
	"comment" text,
	"verified" boolean DEFAULT false,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"helpful" integer DEFAULT 0,
	"reported" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"session_token" text NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_post_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"platform" varchar(20) NOT NULL,
	"publish_at_utc" timestamp with time zone,
	"variant_text" text,
	"asset_ids" jsonb DEFAULT '[]',
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"external_ref" varchar(255),
	"error" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" text,
	"base_text" text NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"scheduled_at_utc" timestamp with time zone,
	"timezone" varchar(50) DEFAULT 'UTC' NOT NULL,
	"created_by" varchar(255),
	"updated_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"email_verified" timestamp,
	"image" text,
	"password" text,
	"phone" varchar(20),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "tenant_quotas" ALTER COLUMN "reset_date" SET DEFAULT (CURRENT_DATE + INTERVAL '30 days');--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accounts_user_id_idx" ON "accounts" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accounts_provider_idx" ON "accounts" ("provider");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accounts_provider_account_id_idx" ON "accounts" ("provider_account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_item_order_idx" ON "order_items" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_tenant_idx" ON "orders" ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "order_number_idx" ON "orders" ("order_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_status_idx" ON "orders" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_created_idx" ON "orders" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_order_idx" ON "payments" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_tenant_idx" ON "payments" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_stripe_idx" ON "payments" ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "review_tenant_idx" ON "product_reviews" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "review_product_idx" ON "product_reviews" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "review_user_idx" ON "product_reviews" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "review_rating_idx" ON "product_reviews" ("rating");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "review_status_idx" ON "product_reviews" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "review_created_idx" ON "product_reviews" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "review_product_status_idx" ON "product_reviews" ("product_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_session_token_idx" ON "sessions" ("session_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_social_post_targets_post_id" ON "social_post_targets" ("post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_social_post_targets_platform" ON "social_post_targets" ("platform");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_social_post_targets_status" ON "social_post_targets" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_social_post_targets_publish_at" ON "social_post_targets" ("publish_at_utc");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_social_post_targets_platform_status" ON "social_post_targets" ("platform","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_social_posts_tenant_id" ON "social_posts" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_social_posts_status" ON "social_posts" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_social_posts_scheduled_at" ON "social_posts" ("scheduled_at_utc");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_social_posts_created_at" ON "social_posts" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_social_posts_tenant_status" ON "social_posts" ("tenant_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_social_posts_tenant_date_range" ON "social_posts" ("tenant_id","scheduled_at_utc");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_tokens_token_idx" ON "verification_tokens" ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_tokens_identifier_idx" ON "verification_tokens" ("identifier");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_post_targets" ADD CONSTRAINT "social_post_targets_post_id_social_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "social_posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- SOCIAL PLANNER ADDITIONS (sin conflictos)
-- ========================================

-- 1. Add timezone to tenants table
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) NOT NULL DEFAULT 'America/Mexico_City';

-- 2. Add reset password fields to users table  
ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

CREATE TABLE IF NOT EXISTS tenant_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL, -- linkedin|facebook|instagram|tiktok|whatsapp_business
  enabled BOOLEAN NOT NULL DEFAULT true,
  limits_per_day INTEGER NOT NULL DEFAULT 1,
  posting_window JSONB NOT NULL DEFAULT '{}',
  default_hashtags TEXT[] NOT NULL DEFAULT '{}',
  policy JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, channel)
);

CREATE INDEX IF NOT EXISTS tenant_channels_tenant_idx ON tenant_channels(tenant_id);

-- 4. Create channel_accounts table
CREATE TABLE IF NOT EXISTS channel_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_channel_id UUID NOT NULL REFERENCES tenant_channels(id) ON DELETE CASCADE,
  external_ref JSONB NOT NULL DEFAULT '{}',
  label TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS channel_accounts_tenant_channel_idx ON channel_accounts(tenant_channel_id);

-- 5. Create channel_credentials table (encrypted tokens)
CREATE TABLE IF NOT EXISTS channel_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES channel_accounts(id) ON DELETE CASCADE,
  access_token_enc TEXT NOT NULL,
  refresh_token_enc TEXT,
  token_type TEXT,
  scopes TEXT[],
  expires_at TIMESTAMPTZ,
  meta JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'ok',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS channel_credentials_account_idx ON channel_credentials(account_id);

-- Add additional columns to social_posts
ALTER TABLE social_posts
ADD COLUMN IF NOT EXISTS body_md TEXT,
ADD COLUMN IF NOT EXISTS media_ids UUID[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS due_date DATE;

CREATE TABLE IF NOT EXISTS content_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  title TEXT,
  body_md TEXT,
  media_ids UUID[] NOT NULL DEFAULT '{}',
  payload JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'ready',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_variants_post_channel_idx ON content_variants(social_post_id, channel);

-- 8. Create posting_rules table
CREATE TABLE IF NOT EXISTS posting_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  frequency TEXT NOT NULL,
  max_per_day INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 0,
  days_off INTEGER[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS posting_rules_tenant_idx ON posting_rules(tenant_id);

-- 9. Create post_jobs table
CREATE TABLE IF NOT EXISTS post_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  content_variant_id UUID NOT NULL REFERENCES content_variants(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES channel_accounts(id) ON DELETE CASCADE,
  run_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  idempotency_key TEXT UNIQUE,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS post_jobs_tenant_status_run_at_idx ON post_jobs(tenant_id, status, run_at);
CREATE INDEX IF NOT EXISTS post_jobs_status_run_at_idx ON post_jobs(status, run_at);

-- 10. Create post_results table
CREATE TABLE IF NOT EXISTS post_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_job_id UUID NOT NULL REFERENCES post_jobs(id) ON DELETE CASCADE,
  external_id TEXT,
  permalink TEXT,
  response JSONB NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS post_results_post_job_idx ON post_results(post_job_id);

-- 11. Create media_renditions table
CREATE TABLE IF NOT EXISTS media_renditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  preset TEXT NOT NULL,
  url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS media_renditions_media_idx ON media_renditions(media_id);
-- Financial Tables Migration
-- Adds Mercado Pago integration and financial tracking
-- Generated: 2025-10-12

-- ============================================================================
-- MERCADO PAGO OAUTH TOKENS
-- ============================================================================

CREATE TABLE mercadopago_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  user_id TEXT NOT NULL, -- MP user ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- Enable RLS
ALTER TABLE mercadopago_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY mercadopago_tokens_tenant_isolation ON mercadopago_tokens
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- MERCADO PAGO PAYMENTS (INGRESOS)
-- ============================================================================

CREATE TABLE mercadopago_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  mp_payment_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'MXN',
  payment_method TEXT,
  payment_method_type TEXT,
  fees_amount DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  payer_info JSONB,
  point_of_interaction JSONB, -- POS info
  external_reference TEXT,
  date_created TIMESTAMP NOT NULL,
  date_approved TIMESTAMP,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE mercadopago_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY mp_payments_tenant_isolation ON mercadopago_payments
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Indexes for performance
CREATE INDEX idx_mp_payments_tenant_date ON mercadopago_payments(tenant_id, date_created);
CREATE INDEX idx_mp_payments_status ON mercadopago_payments(status);
CREATE INDEX idx_mp_payments_mp_id ON mercadopago_payments(mp_payment_id);

-- ============================================================================
-- FINANCIAL MOVEMENTS (INGRESOS + EGRESOS)
-- ============================================================================

CREATE TABLE financial_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('SETTLEMENT', 'REFUND', 'CHARGEBACK', 'WITHDRAWAL', 'FEE', 'CARD_PURCHASE')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'MXN',
  description TEXT,
  reference_id TEXT, -- MP payment_id, statement_id, etc.
  payment_method TEXT,
  payment_method_type TEXT,
  counterparty TEXT, -- cliente, banco, etc.
  movement_date TIMESTAMP NOT NULL,
  reconciled BOOLEAN DEFAULT FALSE,
  reconciliation_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE financial_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY financial_movements_tenant_isolation ON financial_movements
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Indexes
CREATE INDEX idx_financial_movements_tenant_date ON financial_movements(tenant_id, movement_date);
CREATE INDEX idx_financial_movements_type ON financial_movements(type);
CREATE INDEX idx_financial_movements_reconciled ON financial_movements(reconciled);

-- ============================================================================
-- POS TERMINALS
-- ============================================================================

CREATE TABLE pos_terminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  terminal_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pos_terminals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY pos_terminals_tenant_isolation ON pos_terminals
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- FINANCIAL KPIs (CALCULATED DAILY)
-- ============================================================================

CREATE TABLE financial_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_income DECIMAL(10,2) DEFAULT 0,
  total_expenses DECIMAL(10,2) DEFAULT 0,
  net_cash_flow DECIMAL(10,2) DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  average_ticket DECIMAL(10,2) DEFAULT 0,
  approval_rate DECIMAL(5,2) DEFAULT 0,
  refund_rate DECIMAL(5,2) DEFAULT 0,
  chargeback_rate DECIMAL(5,2) DEFAULT 0,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  available_balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, date)
);

-- Enable RLS
ALTER TABLE financial_kpis ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY financial_kpis_tenant_isolation ON financial_kpis
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Indexes
CREATE INDEX idx_financial_kpis_tenant_date ON financial_kpis(tenant_id, date);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON mercadopago_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON mercadopago_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_movements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pos_terminals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_kpis TO authenticated;

-- ============================================================================
-- INITIAL DATA (OPTIONAL)
-- ============================================================================

-- Insert sample POS terminal for testing
-- INSERT INTO pos_terminals (tenant_id, terminal_id, name, location)
-- SELECT id, 'terminal-001', 'Terminal Principal', 'Sucursal Centro'
-- FROM tenants LIMIT 1;-- Tenant Configuration Management
-- Adds configurable settings for each tenant
-- Generated: 2025-10-12

-- ============================================================================
-- TENANT CONFIGS TABLE
-- ============================================================================

CREATE TABLE tenant_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- 'payment_methods', 'pos_settings', 'notifications', 'reports', 'integrations', 'business_rules'
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, category, key)
);

-- Enable RLS
ALTER TABLE tenant_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tenant_configs_tenant_isolation ON tenant_configs
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Indexes
CREATE INDEX idx_tenant_configs_tenant_category ON tenant_configs(tenant_id, category);
CREATE UNIQUE INDEX idx_tenant_configs_tenant_category_key ON tenant_configs(tenant_id, category, key);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_configs TO authenticated;

-- ============================================================================
-- DEFAULT CONFIGURATIONS (OPTIONAL)
-- ============================================================================

-- Insert default configurations for existing tenants
-- These will be created dynamically when tenants access the config API

-- Example default configs (commented out - created via API):
-- Payment Methods: Enable Mercado Pago, disable cash by default
-- POS Settings: Default terminal settings
-- Notifications: Email preferences
-- Reports: Default report settings
-- Integrations: Third-party service settings
-- Business Rules: Tax rates, discount policies, etc.-- ========================================================================
-- CUSTOMER MANAGEMENT TABLES
-- Migration: Add customers, customer_visits, and customer_visit_services tables
-- ========================================================================

-- Create customer status enum
DO $$ BEGIN
  CREATE TYPE customer_status AS ENUM ('active', 'inactive', 'blocked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create visit status enum
DO $$ BEGIN
  CREATE TYPE visit_status AS ENUM ('pending', 'scheduled', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  general_notes TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  status customer_status NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for customers table
CREATE INDEX IF NOT EXISTS customers_tenant_idx ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS customers_phone_idx ON customers(phone);
CREATE INDEX IF NOT EXISTS customers_email_idx ON customers(email);
CREATE INDEX IF NOT EXISTS customers_tenant_phone_idx ON customers(tenant_id, phone);
CREATE INDEX IF NOT EXISTS customers_status_idx ON customers(status);

-- Customer Visits table
CREATE TABLE IF NOT EXISTS customer_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  visit_number INTEGER NOT NULL,
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  next_visit_from DATE,
  next_visit_to DATE,
  status visit_status NOT NULL DEFAULT 'completed',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for customer_visits table
CREATE INDEX IF NOT EXISTS customer_visits_tenant_idx ON customer_visits(tenant_id);
CREATE INDEX IF NOT EXISTS customer_visits_customer_idx ON customer_visits(customer_id);
CREATE INDEX IF NOT EXISTS customer_visits_date_idx ON customer_visits(visit_date);
CREATE INDEX IF NOT EXISTS customer_visits_status_idx ON customer_visits(status);
CREATE INDEX IF NOT EXISTS customer_visits_tenant_customer_idx ON customer_visits(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS customer_visits_appointment_idx ON customer_visits(appointment_id);

-- Customer Visit Services table
CREATE TABLE IF NOT EXISTS customer_visit_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES customer_visits(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  description TEXT,
  unit_price NUMERIC(10, 2) NOT NULL,
  quantity NUMERIC(5, 2) NOT NULL DEFAULT 1,
  subtotal NUMERIC(10, 2) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for customer_visit_services table
CREATE INDEX IF NOT EXISTS customer_visit_services_visit_idx ON customer_visit_services(visit_id);
CREATE INDEX IF NOT EXISTS customer_visit_services_service_idx ON customer_visit_services(service_id);

-- Add comments for documentation
COMMENT ON TABLE customers IS 'Master customer data for each tenant';
COMMENT ON TABLE customer_visits IS 'Visit history tracking with sequential numbering per customer';
COMMENT ON TABLE customer_visit_services IS 'Services performed during each visit';

COMMENT ON COLUMN customers.general_notes IS 'Notes about customer preferences, allergies, skin type, etc.';
COMMENT ON COLUMN customers.tags IS 'Tags for categorization: alergias, preferencias, tipo de piel, etc.';
COMMENT ON COLUMN customer_visits.visit_number IS 'Sequential visit number per customer';
COMMENT ON COLUMN customer_visits.next_visit_from IS 'Suggested next visit date range start';
COMMENT ON COLUMN customer_visits.next_visit_to IS 'Suggested next visit date range end';

-- Grant permissions (adjust as needed based on your RLS setup)
-- These are example grants - modify based on your security requirements
-- GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON customer_visits TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON customer_visit_services TO authenticated;
-- ========================================================================
-- ADD CUSTOMER ADDRESS AND SERVICE IMAGES
-- Migration: Add address field to customers and before/after images to services
-- ========================================================================

-- Add address field to customers table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
    
    -- Add comment for documentation
    COMMENT ON COLUMN customers.address IS 'Dirección de la clienta';
  END IF;
END $$;

-- Add before_image and after_image fields to services table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
    ALTER TABLE services ADD COLUMN IF NOT EXISTS before_image TEXT;
    ALTER TABLE services ADD COLUMN IF NOT EXISTS after_image TEXT;
    
    -- Add comments for documentation
    COMMENT ON COLUMN services.before_image IS 'URL de la imagen "antes" del servicio';
    COMMENT ON COLUMN services.after_image IS 'URL de la imagen "después" del servicio';
  END IF;
END $$;

-- Update RLS policies if needed (adjust based on your security requirements)
-- These are example policies - modify based on your security requirements
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'tenant_isolation') THEN
--     -- No changes needed for existing policies
--   END IF;
--   
--   IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'tenant_isolation') THEN
--     -- No changes needed for existing policies
--   END IF;
-- END $$;