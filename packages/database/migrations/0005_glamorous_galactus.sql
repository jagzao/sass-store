ALTER TABLE "services" ALTER COLUMN "duration" SET DATA TYPE numeric(4, 1);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "customer_id" uuid;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "google_calendar_id" varchar(255);--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "google_calendar_tokens" jsonb;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "google_calendar_connected" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;