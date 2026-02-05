-- Migration Script: Configurable Retouch Date System
-- This script adds the necessary tables and fields for the retouch date system

-- Add next_retouch_date and retouch_service_id fields to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS next_retouch_date DATE,
ADD COLUMN IF NOT EXISTS retouch_service_id UUID REFERENCES services(id);

-- Create service_retouch_config table for configurable retouch frequency per service
CREATE TABLE IF NOT EXISTS service_retouch_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    frequency_type VARCHAR(20) NOT NULL DEFAULT 'days', -- 'days', 'weeks', 'months'
    frequency_value INTEGER NOT NULL DEFAULT 15, -- Number of days/weeks/months
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false, -- Default configuration for tenant
    business_days_only BOOLEAN NOT NULL DEFAULT false, -- Only count business days
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT service_retouch_config_tenant_service_unique UNIQUE (tenant_id, service_id)
);

-- Create indexes for service_retouch_config
CREATE INDEX IF NOT EXISTS service_retouch_config_tenant_idx ON service_retouch_config(tenant_id);
CREATE INDEX IF NOT EXISTS service_retouch_config_service_idx ON service_retouch_config(service_id);
CREATE INDEX IF NOT EXISTS service_retouch_config_tenant_default_idx ON service_retouch_config(tenant_id, is_default);

-- Create tenant_holidays table for days off and holidays
CREATE TABLE IF NOT EXISTS tenant_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- Holiday name
    date DATE NOT NULL, -- Holiday date
    is_recurring BOOLEAN NOT NULL DEFAULT false, -- Recurs every year
    affects_retouch BOOLEAN NOT NULL DEFAULT true, -- Affects retouch calculation
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT tenant_holidays_tenant_date_unique UNIQUE (tenant_id, date)
);

-- Create indexes for tenant_holidays
CREATE INDEX IF NOT EXISTS tenant_holidays_tenant_idx ON tenant_holidays(tenant_id);
CREATE INDEX IF NOT EXISTS tenant_holidays_date_idx ON tenant_holidays(date);
CREATE INDEX IF NOT EXISTS tenant_holidays_recurring_idx ON tenant_holidays(is_recurring);

-- Create default retouch configuration for existing tenants
-- This will set a default 15-day retouch configuration for all existing services
INSERT INTO service_retouch_config (tenant_id, service_id, frequency_type, frequency_value, is_default)
SELECT DISTINCT t.id, s.id, 'days', 15, true
FROM tenants t
CROSS JOIN services s
WHERE s.tenant_id = t.id
AND NOT EXISTS (
    SELECT 1 FROM service_retouch_config 
    WHERE tenant_id = t.id AND service_id = s.id
);

-- Add comments for documentation
COMMENT ON COLUMN customers.next_retouch_date IS 'Próxima fecha de retoque calculada automáticamente';
COMMENT ON COLUMN customers.retouch_service_id IS 'Servicio base para cálculo de retoque';
COMMENT ON TABLE service_retouch_config IS 'Configuración de frecuencia de retoque por servicio';
COMMENT ON TABLE tenant_holidays IS 'Días festivos y no laborables para cálculo de retoque';

-- Create RLS policies for the new tables
ALTER TABLE service_retouch_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_holidays ENABLE ROW LEVEL SECURITY;

-- RLS policy for service_retouch_config: tenants can only access their own configurations
CREATE POLICY tenant_isolation_service_retouch_config ON service_retouch_config
    FOR ALL TO authenticated
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- RLS policy for tenant_holidays: tenants can only access their own holidays
CREATE POLICY tenant_isolation_tenant_holidays ON tenant_holidays
    FOR ALL TO authenticated
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Grant permissions
GRANT ALL ON service_retouch_config TO authenticated;
GRANT ALL ON tenant_holidays TO authenticated;