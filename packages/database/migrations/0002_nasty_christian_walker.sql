DO $$ BEGIN
 CREATE TYPE "public"."customer_status" AS ENUM('active', 'inactive', 'blocked');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."roles" AS ENUM('Admin', 'Gerente', 'Personal', 'Cliente');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."visit_status" AS ENUM('pending', 'scheduled', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"key" varchar(64) NOT NULL,
	"name" varchar(100) NOT NULL,
	"prefix" varchar(16) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"permissions" jsonb DEFAULT '[]' NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "api_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"slug" text NOT NULL,
	"lut_file" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "channel_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_channel_id" uuid NOT NULL,
	"external_ref" jsonb DEFAULT '{}' NOT NULL,
	"label" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "channel_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"access_token_enc" text NOT NULL,
	"refresh_token_enc" text,
	"token_type" text,
	"scopes" text[],
	"expires_at" timestamp with time zone,
	"meta" jsonb DEFAULT '{}' NOT NULL,
	"status" varchar(20) DEFAULT 'ok' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "content_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"social_post_id" uuid NOT NULL,
	"channel" varchar(50) NOT NULL,
	"title" text,
	"body_md" text,
	"media_ids" uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
	"payload" jsonb DEFAULT '{}' NOT NULL,
	"status" varchar(20) DEFAULT 'ready' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_visit_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"description" text,
	"unit_price" numeric(10, 2) NOT NULL,
	"quantity" numeric(5, 2) DEFAULT '1' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customer_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"appointment_id" uuid,
	"visit_number" integer NOT NULL,
	"visit_date" timestamp with time zone NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"next_visit_from" date,
	"next_visit_to" date,
	"status" "visit_status" DEFAULT 'completed' NOT NULL,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"address" text,
	"general_notes" text,
	"tags" text[] DEFAULT ARRAY[]::text[],
	"status" "customer_status" DEFAULT 'active' NOT NULL,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financial_kpis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"date" date NOT NULL,
	"total_income" numeric(12, 2) NOT NULL,
	"total_expenses" numeric(12, 2) NOT NULL,
	"net_cash_flow" numeric(12, 2) NOT NULL,
	"average_ticket" numeric(10, 2) NOT NULL,
	"approval_rate" numeric(5, 2) NOT NULL,
	"transaction_count" integer NOT NULL,
	"available_balance" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financial_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"payment_method" varchar(50),
	"reconciled" boolean DEFAULT false,
	"movement_date" date NOT NULL,
	"description" text,
	"reference_id" text,
	"counterparty" text,
	"amount" numeric(12, 2) NOT NULL,
	"reconciliation_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media_renditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_id" uuid NOT NULL,
	"preset" text NOT NULL,
	"url" text NOT NULL,
	"width" integer,
	"height" integer,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mercadopago_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_id" uuid,
	"mercadopago_payment_id" varchar(100) NOT NULL,
	"payment_intent_id" varchar(100),
	"status" varchar(20) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'MXN' NOT NULL,
	"payment_method" varchar(50),
	"external_reference" varchar(100),
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "mercadopago_payments_mercadopago_payment_id_unique" UNIQUE("mercadopago_payment_id"),
	CONSTRAINT "mercadopago_payments_payment_intent_id_unique" UNIQUE("payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mercadopago_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_in" integer NOT NULL,
	"token_type" varchar(20) NOT NULL,
	"scope" text,
	"merchant_id" varchar(100),
	"environment" varchar(10) DEFAULT 'production' NOT NULL,
	"expires_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth_state_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"state" varchar(64) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "oauth_state_tokens_state_unique" UNIQUE("state")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pos_terminals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"terminal_id" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"location" varchar(200),
	"last_sync" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pos_terminals_terminal_id_unique" UNIQUE("terminal_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "post_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"channel" varchar(50) NOT NULL,
	"content_variant_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"run_at" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"idempotency_key" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "post_jobs_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "post_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_job_id" uuid NOT NULL,
	"external_id" text,
	"permalink" text,
	"response" jsonb DEFAULT '{}' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "posting_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"channel" varchar(50) NOT NULL,
	"frequency" text NOT NULL,
	"max_per_day" integer DEFAULT 1 NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"days_off" integer[] DEFAULT ARRAY[]::integer[] NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"campaign_id" uuid,
	"title" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"image_urls" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"overlay_type" text NOT NULL,
	"music_file" text NOT NULL,
	"duration" numeric(10, 2) DEFAULT '0',
	"hashtags" text[] DEFAULT ARRAY[]::text[],
	"caption" text DEFAULT '',
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenant_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"channel" varchar(50) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"limits_per_day" integer DEFAULT 1 NOT NULL,
	"posting_window" jsonb DEFAULT '{}' NOT NULL,
	"default_hashtags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"policy" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenant_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category" varchar(50) NOT NULL,
	"key" varchar(50) NOT NULL,
	"value" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"items" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tenant_id" uuid NOT NULL,
	"role" "roles" NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP TABLE "social_post_targets";--> statement-breakpoint
DROP INDEX IF EXISTS "audit_tenant_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "audit_action_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "audit_created_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_social_posts_tenant_id";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_social_posts_status";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_social_posts_scheduled_at";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_social_posts_created_at";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_social_posts_tenant_status";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_social_posts_tenant_date_range";--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "tenant_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "action" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "actor_id" uuid;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "target_table" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "target_id" uuid;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "data" jsonb DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "before_image" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "after_image" text;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "body_md" text;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "media_ids" uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "tags" text[] DEFAULT ARRAY[]::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "due_date" date;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "timezone" varchar(50) DEFAULT 'America/Mexico_City' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token_expiry" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "channel_accounts" ADD CONSTRAINT "channel_accounts_tenant_channel_id_tenant_channels_id_fk" FOREIGN KEY ("tenant_channel_id") REFERENCES "public"."tenant_channels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "channel_credentials" ADD CONSTRAINT "channel_credentials_account_id_channel_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."channel_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_variants" ADD CONSTRAINT "content_variants_social_post_id_social_posts_id_fk" FOREIGN KEY ("social_post_id") REFERENCES "public"."social_posts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_visit_services" ADD CONSTRAINT "customer_visit_services_visit_id_customer_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."customer_visits"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_visit_services" ADD CONSTRAINT "customer_visit_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_visits" ADD CONSTRAINT "customer_visits_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_visits" ADD CONSTRAINT "customer_visits_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customer_visits" ADD CONSTRAINT "customer_visits_appointment_id_bookings_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "financial_kpis" ADD CONSTRAINT "financial_kpis_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "financial_movements" ADD CONSTRAINT "financial_movements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_renditions" ADD CONSTRAINT "media_renditions_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mercadopago_payments" ADD CONSTRAINT "mercadopago_payments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mercadopago_payments" ADD CONSTRAINT "mercadopago_payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mercadopago_tokens" ADD CONSTRAINT "mercadopago_tokens_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "oauth_state_tokens" ADD CONSTRAINT "oauth_state_tokens_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pos_terminals" ADD CONSTRAINT "pos_terminals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_jobs" ADD CONSTRAINT "post_jobs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_jobs" ADD CONSTRAINT "post_jobs_content_variant_id_content_variants_id_fk" FOREIGN KEY ("content_variant_id") REFERENCES "public"."content_variants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_jobs" ADD CONSTRAINT "post_jobs_account_id_channel_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."channel_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_results" ADD CONSTRAINT "post_results_post_job_id_post_jobs_id_fk" FOREIGN KEY ("post_job_id") REFERENCES "public"."post_jobs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "posting_rules" ADD CONSTRAINT "posting_rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reels" ADD CONSTRAINT "reels_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reels" ADD CONSTRAINT "reels_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tenant_channels" ADD CONSTRAINT "tenant_channels_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tenant_configs" ADD CONSTRAINT "tenant_configs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_carts" ADD CONSTRAINT "user_carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "api_key_key_idx" ON "api_keys" USING btree ("key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_key_tenant_idx" ON "api_keys" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_key_status_idx" ON "api_keys" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_key_prefix_idx" ON "api_keys" USING btree ("prefix");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "campaigns_tenant_slug_idx" ON "campaigns" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaigns_tenant_idx" ON "campaigns" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaigns_slug_idx" ON "campaigns" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaigns_type_idx" ON "campaigns" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "channel_accounts_tenant_channel_idx" ON "channel_accounts" USING btree ("tenant_channel_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "channel_credentials_account_idx" ON "channel_credentials" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_variants_post_channel_idx" ON "content_variants" USING btree ("social_post_id","channel");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_visit_services_visit_idx" ON "customer_visit_services" USING btree ("visit_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_visit_services_service_idx" ON "customer_visit_services" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_visits_tenant_idx" ON "customer_visits" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_visits_customer_idx" ON "customer_visits" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_visits_date_idx" ON "customer_visits" USING btree ("visit_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_visits_status_idx" ON "customer_visits" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_visits_tenant_customer_idx" ON "customer_visits" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_visits_appointment_idx" ON "customer_visits" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customers_tenant_idx" ON "customers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customers_phone_idx" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customers_email_idx" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customers_tenant_phone_idx" ON "customers" USING btree ("tenant_id","phone");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customers_status_idx" ON "customers" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_kpis_tenant_date_idx" ON "financial_kpis" USING btree ("tenant_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_movements_tenant_date_idx" ON "financial_movements" USING btree ("tenant_id","movement_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_renditions_media_idx" ON "media_renditions" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mercadopago_payments_tenant_idx" ON "mercadopago_payments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mercadopago_payments_order_idx" ON "mercadopago_payments" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mercadopago_payments_mp_id_idx" ON "mercadopago_payments" USING btree ("mercadopago_payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mercadopago_payments_intent_idx" ON "mercadopago_payments" USING btree ("payment_intent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mercadopago_tokens_tenant_idx" ON "mercadopago_tokens" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mercadopago_tokens_merchant_id_idx" ON "mercadopago_tokens" USING btree ("merchant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "oauth_state_tokens_state_idx" ON "oauth_state_tokens" USING btree ("state");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "oauth_state_tokens_tenant_idx" ON "oauth_state_tokens" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "oauth_state_tokens_expires_idx" ON "oauth_state_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pos_terminals_tenant_idx" ON "pos_terminals" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pos_terminals_terminal_id_idx" ON "pos_terminals" USING btree ("terminal_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pos_terminals_status_idx" ON "pos_terminals" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_jobs_tenant_status_run_at_idx" ON "post_jobs" USING btree ("tenant_id","status","run_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_jobs_status_run_at_idx" ON "post_jobs" USING btree ("status","run_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_results_post_job_idx" ON "post_results" USING btree ("post_job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posting_rules_tenant_idx" ON "posting_rules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reels_tenant_idx" ON "reels" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reels_campaign_idx" ON "reels" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reels_status_idx" ON "reels" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reels_created_idx" ON "reels" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_channels_tenant_channel_idx" ON "tenant_channels" USING btree ("tenant_id","channel");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenant_channels_tenant_idx" ON "tenant_channels" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_configs_tenant_category_key_idx" ON "tenant_configs" USING btree ("tenant_id","category","key");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_carts_user_id_idx" ON "user_carts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_roles_user_tenant_unique_idx" ON "user_roles" USING btree ("user_id","tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_roles_user_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_roles_tenant_idx" ON "user_roles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_tenant_idx" ON "audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_tenant_featured_idx" ON "products" USING btree ("tenant_id","featured");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_tenant_category_idx" ON "products" USING btree ("tenant_id","category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_created_at_idx" ON "products" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "social_posts_tenant_idx" ON "social_posts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "social_posts_status_idx" ON "social_posts" USING btree ("status");--> statement-breakpoint
ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "user_id";--> statement-breakpoint
ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "entity_type";--> statement-breakpoint
ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "entity_id";--> statement-breakpoint
ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "changes";--> statement-breakpoint
ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "ip_address";--> statement-breakpoint
ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "user_agent";--> statement-breakpoint
ALTER TABLE "social_posts" DROP COLUMN IF EXISTS "base_text";--> statement-breakpoint
ALTER TABLE "social_posts" DROP COLUMN IF EXISTS "scheduled_at_utc";--> statement-breakpoint
ALTER TABLE "social_posts" DROP COLUMN IF EXISTS "timezone";--> statement-breakpoint
ALTER TABLE "social_posts" DROP COLUMN IF EXISTS "created_by";--> statement-breakpoint
ALTER TABLE "social_posts" DROP COLUMN IF EXISTS "updated_by";