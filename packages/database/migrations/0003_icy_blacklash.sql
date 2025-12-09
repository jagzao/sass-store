DO $$ BEGIN
 CREATE TYPE "public"."visit_photo_type" AS ENUM('BEFORE', 'AFTER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "visit_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"url" text NOT NULL,
	"type" "visit_photo_type" NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "visit_photos" ADD CONSTRAINT "visit_photos_visit_id_customer_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."customer_visits"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "visit_photos_visit_idx" ON "visit_photos" USING btree ("visit_id");