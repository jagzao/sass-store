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
