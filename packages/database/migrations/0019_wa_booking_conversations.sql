-- Migration: wa_booking_conversations — estado de conversaciones WhatsApp para el Booking Assistant
-- Created: 2026-06-03
--
-- Flujo esperado:
--   1. Cliente envía "haz cita" en WhatsApp
--   2. n8n detecta el mensaje, parsea servicio/fecha/hora del historial de conversación
--   3. Guarda el estado en esta tabla (state='awaiting_confirm') y envía mensaje con botones
--   4. Cliente presiona "✅ Confirmar" → n8n crea el booking y actualiza a state='confirmed'
--   5. Las conversaciones expiran automáticamente tras 30 minutos sin confirmar

CREATE TABLE IF NOT EXISTS wa_booking_conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           VARCHAR(20) NOT NULL,
  tenant_slug     VARCHAR(100) NOT NULL DEFAULT 'wondernails',
  state           VARCHAR(30) NOT NULL DEFAULT 'awaiting_confirm',
  -- state values: awaiting_confirm | confirmed | cancelled | expired
  service_id      UUID,
  service_name    VARCHAR(255),
  service_price   NUMERIC(10,2),
  date_iso        DATE,
  time_str        VARCHAR(10),
  customer_name   VARCHAR(100),
  customer_id     UUID,
  trigger_msg_id  VARCHAR(100),
  confirm_msg_id  VARCHAR(100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 minutes'
);

CREATE INDEX IF NOT EXISTS wa_booking_convos_phone_idx    ON wa_booking_conversations(phone);
CREATE INDEX IF NOT EXISTS wa_booking_convos_state_idx    ON wa_booking_conversations(state);
CREATE INDEX IF NOT EXISTS wa_booking_convos_expires_idx  ON wa_booking_conversations(expires_at);
ALTER TABLE wa_booking_conversations
  ADD CONSTRAINT wa_booking_convos_trigger_msg_id_uq UNIQUE (trigger_msg_id);
