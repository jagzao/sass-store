-- WhatsApp Messages Table Migration
-- Created: 2026-03-05
-- Purpose: Store WhatsApp messages for audit and history

-- Tabla para almacenar mensajes de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id), -- Para multi-tenant (nullable para mensajes entrantes sin tenant)
    mensaje_id VARCHAR(100) UNIQUE NOT NULL, -- ID de WhatsApp
    numero VARCHAR(20) NOT NULL, -- Número del cliente (formato internacional sin +)
    contenido TEXT,
    tipo VARCHAR(20) NOT NULL DEFAULT 'text', -- text, image, video, document, button, interactive
    direccion VARCHAR(10) NOT NULL, -- 'inbound' o 'outbound'
    estado VARCHAR(20) NOT NULL DEFAULT 'received', -- received, sent, delivered, read, failed
    tipo_interaccion VARCHAR(50), -- Para botones/list replies: "button:seguimiento", "list:opcion1"
    metadata JSONB, -- Para datos adicionales (plantilla usada, errores, etc.)
    customer_id UUID REFERENCES customers(id), -- Referencia al cliente si existe
    related_entity_type VARCHAR(50), -- 'order', 'booking', 'quote', etc.
    related_entity_id UUID, -- ID de la entidad relacionada
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_tenant ON whatsapp_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_numero ON whatsapp_messages(numero);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direccion ON whatsapp_messages(direccion);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_estado ON whatsapp_messages(estado);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_customer ON whatsapp_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_related ON whatsapp_messages(related_entity_type, related_entity_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at
CREATE TRIGGER update_whatsapp_messages_updated_at
    BEFORE UPDATE ON whatsapp_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE whatsapp_messages IS 'Almacena mensajes enviados y recibidos via WhatsApp Cloud API';
COMMENT ON COLUMN whatsapp_messages.mensaje_id IS 'ID del mensaje proporcionado por WhatsApp API';
COMMENT ON COLUMN whatsapp_messages.numero IS 'Número de teléfono en formato internacional (sin +)';
COMMENT ON COLUMN whatsapp_messages.direccion IS 'Direction: inbound = del cliente, outbound = nuestro';
COMMENT ON COLUMN whatsapp_messages.estado IS 'Estado del mensaje: received, sent, delivered, read, failed';
COMMENT ON COLUMN whatsapp_messages.tipo_interaccion IS 'Tipo de interacción para botones/listas: button:id o list:reply_id';
COMMENT ON COLUMN whatsapp_messages.related_entity_type IS 'Entidad relacionada: order, booking, quote, customer, etc.';
