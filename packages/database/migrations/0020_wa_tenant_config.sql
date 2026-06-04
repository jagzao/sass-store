-- Migration: wa_tenant_config — configuración WhatsApp por tenant
-- Created: 2026-06-04
--
-- Cada tenant registra su número de WhatsApp Business aquí.
-- phone_number_id (de Meta) identifica el tenant en el webhook.

CREATE TABLE IF NOT EXISTS wa_tenant_config (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug         VARCHAR(100) UNIQUE NOT NULL,
  phone_number_id     VARCHAR(50)  UNIQUE NOT NULL,
  display_name        VARCHAR(100) NOT NULL,
  bot_name            VARCHAR(50)  NOT NULL DEFAULT 'Asistente',
  tone                VARCHAR(20)  NOT NULL DEFAULT 'amigable',
  greeting_msg        TEXT         NOT NULL DEFAULT '¡Hola! 👋 ¿En qué puedo ayudarte?',
  fallback_msg        TEXT         NOT NULL DEFAULT 'No entendí bien, ¿puedes repetirlo de otra forma?',
  escalation_msg      TEXT         NOT NULL DEFAULT 'Te voy a conectar con alguien del equipo ahora.',
  escalation_phone    VARCHAR(20),
  ai_enabled          BOOLEAN NOT NULL DEFAULT true,
  max_ai_tokens       INTEGER NOT NULL DEFAULT 300,
  features            JSONB NOT NULL DEFAULT '{
    "booking_enabled": true,
    "availability_queries": true,
    "ai_support": true,
    "campaigns_enabled": false,
    "human_handoff": true,
    "max_concurrent_sessions": 50
  }'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wa_tenant_config_slug_idx ON wa_tenant_config(tenant_slug);

-- Seed: wondernails (tenant principal de pruebas)
-- Reemplazar phone_number_id con el valor real de Meta Dashboard
INSERT INTO wa_tenant_config (tenant_slug, phone_number_id, display_name, bot_name, tone, greeting_msg)
VALUES (
  'wondernails',
  '214863935038316',
  'Wonder Nails Studio',
  'Sofía',
  'amigable',
  '¡Hola! 💅 Soy Sofía, asistente de Wonder Nails. ¿En qué te puedo ayudar hoy?'
)
ON CONFLICT (tenant_slug) DO UPDATE SET
  phone_number_id = EXCLUDED.phone_number_id,
  display_name    = EXCLUDED.display_name,
  bot_name        = EXCLUDED.bot_name;
