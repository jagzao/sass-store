-- Migration: Add Transaction Categories
-- Description: Creates transaction_categories table and links it to financial_movements
-- Created: 2026-02-13

-- ============================================================================
-- TRANSACTION CATEGORIES TABLE
-- ============================================================================

CREATE TABLE transaction_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  icon VARCHAR(50),
  is_fixed BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES transaction_categories(id),
  budget_alert_threshold INTEGER DEFAULT 80 CHECK (budget_alert_threshold >= 0 AND budget_alert_threshold <= 100),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, name, type)
);

-- Enable RLS
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policy for tenant isolation
CREATE POLICY transaction_categories_tenant_isolation ON transaction_categories
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Indexes for performance
CREATE INDEX idx_transaction_categories_tenant ON transaction_categories(tenant_id);
CREATE INDEX idx_transaction_categories_type ON transaction_categories(type);
CREATE INDEX idx_transaction_categories_tenant_type ON transaction_categories(tenant_id, type);
CREATE INDEX idx_transaction_categories_parent ON transaction_categories(parent_id);

-- ============================================================================
-- MODIFY FINANCIAL_MOVEMENTS TO ADD CATEGORY REFERENCE
-- ============================================================================

ALTER TABLE financial_movements 
ADD COLUMN category_id UUID REFERENCES transaction_categories(id);

-- Index for category lookups
CREATE INDEX idx_financial_movements_category ON financial_movements(category_id);

-- Update RLS policy for financial_movements if needed
-- (Policy already exists from previous migration)

-- ============================================================================
-- DEFAULT CATEGORIES SEED DATA FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_categories(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  -- INCOME CATEGORIES
  INSERT INTO transaction_categories (tenant_id, type, name, description, color, icon, is_default, sort_order) VALUES
    (p_tenant_id, 'income', 'Salario', 'Ingresos por trabajo asalariado', '#10B981', 'briefcase', true, 1),
    (p_tenant_id, 'income', 'Ventas', 'Ingresos por venta de productos o servicios', '#3B82F6', 'shopping-cart', true, 2),
    (p_tenant_id, 'income', 'Freelance', 'Trabajos independientes o proyectos', '#8B5CF6', 'laptop', true, 3),
    (p_tenant_id, 'income', 'Inversiones', 'Dividendos, intereses, plusvalías', '#F59E0B', 'trending-up', true, 4),
    (p_tenant_id, 'income', 'Regalos', 'Dinero recibido como regalo', '#EC4899', 'gift', true, 5),
    (p_tenant_id, 'income', 'Reembolsos', 'Devoluciones de dinero', '#6B7280', 'rotate-ccw', true, 6),
    (p_tenant_id, 'income', 'Otros Ingresos', 'Otros ingresos misceláneos', '#9CA3AF', 'plus-circle', true, 99);

  -- EXPENSE CATEGORIES
  INSERT INTO transaction_categories (tenant_id, type, name, description, color, icon, is_fixed, is_default, sort_order) VALUES
    (p_tenant_id, 'expense', 'Vivienda', 'Renta, hipoteca, mantenimiento', '#EF4444', 'home', true, true, 1),
    (p_tenant_id, 'expense', 'Alimentación', 'Comida, supermercado, restaurantes', '#F97316', 'utensils', false, true, 2),
    (p_tenant_id, 'expense', 'Transporte', 'Gasolina, transporte público, Uber', '#84CC16', 'car', false, true, 3),
    (p_tenant_id, 'expense', 'Servicios', 'Luz, agua, internet, teléfono', '#06B6D4', 'zap', true, true, 4),
    (p_tenant_id, 'expense', 'Educación', 'Colegiaturas, cursos, libros', '#3B82F6', 'graduation-cap', true, true, 5),
    (p_tenant_id, 'expense', 'Salud', 'Médico, medicinas, seguros', '#EC4899', 'heart-pulse', false, true, 6),
    (p_tenant_id, 'expense', 'Entretenimiento', 'Cine, streaming, hobbies', '#8B5CF6', 'film', false, true, 7),
    (p_tenant_id, 'expense', 'Ropa', 'Vestimenta y accesorios', '#D946EF', 'shirt', false, true, 8),
    (p_tenant_id, 'expense', 'Ahorro/Inversión', 'Aportaciones a ahorro o inversiones', '#10B981', 'piggy-bank', false, true, 9),
    (p_tenant_id, 'expense', 'Deudas', 'Pagos a tarjetas, préstamos', '#F43F5E', 'credit-card', true, true, 10),
    (p_tenant_id, 'expense', 'Insumos', 'Materiales, papel, comida (negocio)', '#6366F1', 'package', false, true, 11),
    (p_tenant_id, 'expense', 'Otros Gastos', 'Gastos misceláneos', '#9CA3AF', 'more-horizontal', false, true, 99);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER TO CREATE DEFAULT CATEGORIES FOR NEW TENANTS
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_categories_on_tenant()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_categories(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (run manually if you want automatic creation)
-- CREATE TRIGGER after_tenant_insert
--   AFTER INSERT ON tenants
--   FOR EACH ROW
--   EXECUTE FUNCTION create_default_categories_on_tenant();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON transaction_categories TO authenticated;

-- ============================================================================
-- SEED EXISTING TENANTS (Optional - Run manually if needed)
-- ============================================================================

-- Uncomment to create categories for all existing tenants:
-- SELECT create_default_categories(id) FROM tenants;
