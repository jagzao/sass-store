-- Migration: wa_campaigns + wa_automation_rules
-- Created: 2026-06-04

CREATE TABLE IF NOT EXISTS wa_campaigns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug         VARCHAR(100) NOT NULL,
  name                VARCHAR(255) NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'draft',
  -- status: draft | scheduled | sending | completed | failed | cancelled
  message_template_id VARCHAR(100),
  template_vars       JSONB NOT NULL DEFAULT '{}',
  audience_type       VARCHAR(20) NOT NULL DEFAULT 'all',
  -- audience_type: all | segment | manual
  audience_filter     JSONB NOT NULL DEFAULT '{}',
  scheduled_at        TIMESTAMPTZ,
  sent_count          INTEGER NOT NULL DEFAULT 0,
  delivered_count     INTEGER NOT NULL DEFAULT 0,
  read_count          INTEGER NOT NULL DEFAULT 0,
  reply_count         INTEGER NOT NULL DEFAULT 0,
  created_by          UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wa_campaigns_tenant_idx ON wa_campaigns(tenant_slug);
CREATE INDEX IF NOT EXISTS wa_campaigns_status_idx ON wa_campaigns(status);
CREATE INDEX IF NOT EXISTS wa_campaigns_scheduled_idx ON wa_campaigns(scheduled_at) WHERE status = 'scheduled';

CREATE TABLE IF NOT EXISTS wa_automation_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug     VARCHAR(100) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  enabled         BOOLEAN NOT NULL DEFAULT true,
  trigger_event   VARCHAR(100) NOT NULL,
  -- booking_confirmed | booking_cancelled | customer_inactive_30d | after_visit | birthday
  conditions      JSONB NOT NULL DEFAULT '{}',
  action_type     VARCHAR(50) NOT NULL DEFAULT 'send_template',
  -- send_template | send_text | escalate
  action_config   JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wa_automation_rules_tenant_idx ON wa_automation_rules(tenant_slug);
CREATE INDEX IF NOT EXISTS wa_automation_rules_trigger_idx ON wa_automation_rules(trigger_event);
