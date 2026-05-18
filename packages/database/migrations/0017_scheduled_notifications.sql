-- Migration: scheduled_notifications — cola de notificaciones para consumo externo (n8n, cron, etc.)
-- Created: 2026-05-16
--
-- Flujo esperado:
--   1. La app inserta filas con status = 'pending' y scheduled_at <= ahora (o futuro).
--   2. n8n (u otro worker) consulta pending, marca 'processing', envía WhatsApp/email.
--   3. El worker actualiza a 'sent' (+ sent_at, external_message_id) o 'failed' (+ last_error).

CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  channel VARCHAR(30) NOT NULL DEFAULT 'whatsapp',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',

  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  recipient_phone VARCHAR(20),
  recipient_email VARCHAR(255),
  recipient_name VARCHAR(100),

  subject VARCHAR(255),
  body TEXT NOT NULL,
  template_key VARCHAR(50),

  payload JSONB,

  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,

  external_message_id VARCHAR(100),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,

  idempotency_key VARCHAR(120),
  created_by VARCHAR(100),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT scheduled_notifications_status_check CHECK (
    status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')
  ),
  CONSTRAINT scheduled_notifications_channel_check CHECK (
    channel IN ('whatsapp', 'email', 'sms')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS scheduled_notifications_idempotency_key_idx
  ON scheduled_notifications (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS scheduled_notifications_tenant_status_scheduled_idx
  ON scheduled_notifications (tenant_id, status, scheduled_at);

CREATE INDEX IF NOT EXISTS scheduled_notifications_pending_poll_idx
  ON scheduled_notifications (status, scheduled_at)
  WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS scheduled_notifications_booking_idx
  ON scheduled_notifications (booking_id)
  WHERE booking_id IS NOT NULL;

CREATE TRIGGER update_scheduled_notifications_updated_at
  BEFORE UPDATE ON scheduled_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE scheduled_notifications IS
  'Cola de notificaciones programadas. Consumida por n8n/worker; la app solo encola y el worker actualiza sent/failed.';

COMMENT ON COLUMN scheduled_notifications.status IS
  'pending → processing → sent | failed | cancelled';

COMMENT ON COLUMN scheduled_notifications.idempotency_key IS
  'Evita duplicados (ej. booking_reschedule:{bookingId}:{newStartIso})';

-- RLS multitenant
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'scheduled_notifications'
      AND policyname = 'scheduled_notifications_tenant_isolation'
  ) THEN
    CREATE POLICY scheduled_notifications_tenant_isolation
      ON scheduled_notifications
      FOR ALL
      TO authenticated
      USING (tenant_id = get_current_tenant_id())
      WITH CHECK (tenant_id = get_current_tenant_id());
  END IF;
END
$$;
