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
