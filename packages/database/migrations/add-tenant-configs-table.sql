-- Tenant Configuration Management
-- Adds configurable settings for each tenant
-- Generated: 2025-10-12

-- ============================================================================
-- TENANT CONFIGS TABLE
-- ============================================================================

CREATE TABLE tenant_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- 'payment_methods', 'pos_settings', 'notifications', 'reports', 'integrations', 'business_rules'
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, category, key)
);

-- Enable RLS
ALTER TABLE tenant_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tenant_configs_tenant_isolation ON tenant_configs
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Indexes
CREATE INDEX idx_tenant_configs_tenant_category ON tenant_configs(tenant_id, category);
CREATE UNIQUE INDEX idx_tenant_configs_tenant_category_key ON tenant_configs(tenant_id, category, key);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON tenant_configs TO authenticated;

-- ============================================================================
-- DEFAULT CONFIGURATIONS (OPTIONAL)
-- ============================================================================

-- Insert default configurations for existing tenants
-- These will be created dynamically when tenants access the config API

-- Example default configs (commented out - created via API):
-- Payment Methods: Enable Mercado Pago, disable cash by default
-- POS Settings: Default terminal settings
-- Notifications: Email preferences
-- Reports: Default report settings
-- Integrations: Third-party service settings
-- Business Rules: Tax rates, discount policies, etc.