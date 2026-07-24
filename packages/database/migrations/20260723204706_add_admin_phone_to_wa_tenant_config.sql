-- Migration: admin_phone alias for escalation_phone in wa_tenant_config
-- Created: 2026-07-23
--
-- External automations reference wt.admin_phone, which does not exist.
-- Add it as a real column kept in sync with escalation_phone so legacy
-- queries work without changing application code.

ALTER TABLE wa_tenant_config
ADD COLUMN IF NOT EXISTS admin_phone VARCHAR(20);

-- Initialize from existing escalation_phone values
UPDATE wa_tenant_config
SET admin_phone = escalation_phone
WHERE admin_phone IS NULL AND escalation_phone IS NOT NULL;

-- Keep both columns in sync when either side is written.
-- ponytail: bidirectional trigger avoids surprises for legacy automations.
CREATE OR REPLACE FUNCTION sync_wa_tenant_config_phones()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.admin_phone IS DISTINCT FROM NEW.escalation_phone THEN
      IF NEW.admin_phone IS NOT NULL AND NEW.admin_phone IS DISTINCT FROM OLD.admin_phone THEN
        NEW.escalation_phone := NEW.admin_phone;
      ELSIF NEW.escalation_phone IS NOT NULL AND NEW.escalation_phone IS DISTINCT FROM OLD.escalation_phone THEN
        NEW.admin_phone := NEW.escalation_phone;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wa_tenant_config_phone_sync ON wa_tenant_config;
CREATE TRIGGER wa_tenant_config_phone_sync
BEFORE INSERT OR UPDATE ON wa_tenant_config
FOR EACH ROW
EXECUTE FUNCTION sync_wa_tenant_config_phones();
