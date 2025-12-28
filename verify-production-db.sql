-- Verify Tenant Exists
SELECT id, slug, name FROM tenants WHERE slug = 'wondernails';

-- Attempt Insert (Wrapped in transaction to roll back)
BEGIN;
INSERT INTO social_posts (
  "tenant_id", 
  "title", 
  "base_text", 
  "status", 
  "scheduled_at_utc", 
  "timezone", 
  "created_by", 
  "updated_by"
)
VALUES (
  (SELECT id FROM tenants WHERE slug = 'wondernails' LIMIT 1),
  'Debug Post',
  'Testing database direct insert',
  'draft',
  NOW(),
  'UTC',
  'debug_user',
  'debug_user'
)
RETURNING id;
ROLLBACK;
