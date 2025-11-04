-- Financial Tables Migration
-- Adds Mercado Pago integration and financial tracking
-- Generated: 2025-10-12

-- ============================================================================
-- MERCADO PAGO OAUTH TOKENS
-- ============================================================================

CREATE TABLE mercadopago_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  user_id TEXT NOT NULL, -- MP user ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- Enable RLS
ALTER TABLE mercadopago_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY mercadopago_tokens_tenant_isolation ON mercadopago_tokens
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- MERCADO PAGO PAYMENTS (INGRESOS)
-- ============================================================================

CREATE TABLE mercadopago_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  mp_payment_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'MXN',
  payment_method TEXT,
  payment_method_type TEXT,
  fees_amount DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  payer_info JSONB,
  point_of_interaction JSONB, -- POS info
  external_reference TEXT,
  date_created TIMESTAMP NOT NULL,
  date_approved TIMESTAMP,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE mercadopago_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY mp_payments_tenant_isolation ON mercadopago_payments
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Indexes for performance
CREATE INDEX idx_mp_payments_tenant_date ON mercadopago_payments(tenant_id, date_created);
CREATE INDEX idx_mp_payments_status ON mercadopago_payments(status);
CREATE INDEX idx_mp_payments_mp_id ON mercadopago_payments(mp_payment_id);

-- ============================================================================
-- FINANCIAL MOVEMENTS (INGRESOS + EGRESOS)
-- ============================================================================

CREATE TABLE financial_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('SETTLEMENT', 'REFUND', 'CHARGEBACK', 'WITHDRAWAL', 'FEE', 'CARD_PURCHASE')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'MXN',
  description TEXT,
  reference_id TEXT, -- MP payment_id, statement_id, etc.
  payment_method TEXT,
  payment_method_type TEXT,
  counterparty TEXT, -- cliente, banco, etc.
  movement_date TIMESTAMP NOT NULL,
  reconciled BOOLEAN DEFAULT FALSE,
  reconciliation_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE financial_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY financial_movements_tenant_isolation ON financial_movements
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Indexes
CREATE INDEX idx_financial_movements_tenant_date ON financial_movements(tenant_id, movement_date);
CREATE INDEX idx_financial_movements_type ON financial_movements(type);
CREATE INDEX idx_financial_movements_reconciled ON financial_movements(reconciled);

-- ============================================================================
-- POS TERMINALS
-- ============================================================================

CREATE TABLE pos_terminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  terminal_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pos_terminals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY pos_terminals_tenant_isolation ON pos_terminals
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- FINANCIAL KPIs (CALCULATED DAILY)
-- ============================================================================

CREATE TABLE financial_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_income DECIMAL(10,2) DEFAULT 0,
  total_expenses DECIMAL(10,2) DEFAULT 0,
  net_cash_flow DECIMAL(10,2) DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  average_ticket DECIMAL(10,2) DEFAULT 0,
  approval_rate DECIMAL(5,2) DEFAULT 0,
  refund_rate DECIMAL(5,2) DEFAULT 0,
  chargeback_rate DECIMAL(5,2) DEFAULT 0,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  available_balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, date)
);

-- Enable RLS
ALTER TABLE financial_kpis ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY financial_kpis_tenant_isolation ON financial_kpis
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Indexes
CREATE INDEX idx_financial_kpis_tenant_date ON financial_kpis(tenant_id, date);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON mercadopago_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON mercadopago_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_movements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pos_terminals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_kpis TO authenticated;

-- ============================================================================
-- INITIAL DATA (OPTIONAL)
-- ============================================================================

-- Insert sample POS terminal for testing
-- INSERT INTO pos_terminals (tenant_id, terminal_id, name, location)
-- SELECT id, 'terminal-001', 'Terminal Principal', 'Sucursal Centro'
-- FROM tenants LIMIT 1;