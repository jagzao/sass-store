-- Create quotes table if it doesn't exist
CREATE TABLE IF NOT EXISTS "quotes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "quote_number" VARCHAR(50) NOT NULL,
    "customer_name" VARCHAR(100) NOT NULL,
    "customer_email" VARCHAR(255),
    "customer_phone" VARCHAR(20),
    "total_amount" DECIMAL(10, 2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "validity_days" INTEGER NOT NULL DEFAULT 15,
    "expires_at" TIMESTAMP,
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Create unique index for quote_number per tenant
CREATE INDEX IF NOT EXISTS "quote_tenant_idx" ON "quotes"("tenant_id");
CREATE INDEX IF NOT EXISTS "quote_status_idx" ON "quotes"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "quote_number_idx" ON "quotes"("tenant_id", "quote_number");

-- Create quote_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS "quote_items" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "quote_id" UUID NOT NULL REFERENCES "quotes"("id") ON DELETE CASCADE,
    "type" VARCHAR(20) NOT NULL,
    "item_id" UUID,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "unit_price" DECIMAL(10, 2) NOT NULL,
    "quantity" DECIMAL(10, 2) NOT NULL DEFAULT '1',
    "subtotal" DECIMAL(10, 2) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "quote_item_quote_idx" ON "quote_items"("quote_id");

-- Insert a test quote for zo-system tenant
INSERT INTO "quotes" (
    "id", 
    "tenant_id", 
    "quote_number", 
    "customer_name", 
    "customer_email", 
    "customer_phone", 
    "total_amount", 
    "status", 
    "validity_days", 
    "expires_at", 
    "notes", 
    "metadata"
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'c5f09699-c10e-4b3e-90b4-d65375a74516'::uuid,
    'Q-TEST-001',
    'Cliente de Prueba',
    'test@example.com',
    '+1234567890',
    299.99,
    'pending',
    15,
    NOW() + INTERVAL '15 days',
    'Cotizacion de prueba para envio de email',
    '{}'
) ON CONFLICT ("tenant_id", "quote_number") DO NOTHING;

-- Insert test quote items
INSERT INTO "quote_items" (
    "id",
    "quote_id",
    "type",
    "name",
    "description",
    "unit_price",
    "quantity",
    "subtotal"
) VALUES 
    (
        '550e8400-e29b-41d4-a716-446655440001'::uuid,
        '550e8400-e29b-41d4-a716-446655440000'::uuid,
        'service',
        'Servicio de Prueba',
        'Descripción del servicio de prueba',
        199.99,
        1,
        199.99
    ),
    (
        '550e8400-e29b-41d4-a716-446655440002'::uuid,
        '550e8400-e29b-41d4-a716-446655440000'::uuid,
        'product',
        'Producto de Prueba',
        'Descripción del producto de prueba',
        100.00,
        1,
        100.00
    ) ON CONFLICT DO NOTHING;