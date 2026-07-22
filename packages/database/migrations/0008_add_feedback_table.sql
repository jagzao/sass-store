-- STRY-031: User feedback capture and n8n routing
CREATE TABLE IF NOT EXISTS "feedback" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id"),
  "category" varchar(20) NOT NULL,
  "message" text NOT NULL,
  "context" jsonb NOT NULL DEFAULT '{}',
  "user_id" uuid REFERENCES "users"("id"),
  "email" varchar(255),
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "n8n_response" jsonb,
  "n8n_request_url" varchar(500),
  "attempts" integer NOT NULL DEFAULT 0,
  "last_attempt_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT NOW(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "feedback_tenant_idx" ON "feedback"("tenant_id");
CREATE INDEX IF NOT EXISTS "feedback_status_idx" ON "feedback"("status");
CREATE INDEX IF NOT EXISTS "feedback_category_idx" ON "feedback"("category");
CREATE INDEX IF NOT EXISTS "feedback_user_idx" ON "feedback"("user_id");
CREATE INDEX IF NOT EXISTS "feedback_created_at_idx" ON "feedback"("created_at");
CREATE INDEX IF NOT EXISTS "feedback_tenant_status_idx" ON "feedback"("tenant_id", "status");

-- ponytail: RLS policies deferred to security skill; run apply-rls.ts before production.
