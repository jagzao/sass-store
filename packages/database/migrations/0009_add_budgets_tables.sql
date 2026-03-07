-- Migration: Add Budgets Tables
-- Description: Creates budgets and budget_categories tables for budget tracking
-- Created: 2026-02-13

-- ============================================================================
-- BUDGETS TABLE
-- ============================================================================

CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('weekly', 'biweekly', 'monthly', 'custom')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_limit DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MXN',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  rollover_enabled BOOLEAN DEFAULT false,
  alert_threshold INTEGER DEFAULT 80 CHECK (alert_threshold >= 0 AND alert_threshold <= 100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT positive_limit CHECK (total_limit >= 0)
);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policy for tenant isolation
CREATE POLICY budgets_tenant_isolation ON budgets
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Indexes for performance
CREATE INDEX idx_budgets_tenant ON budgets(tenant_id);
CREATE INDEX idx_budgets_tenant_status ON budgets(tenant_id, status);
CREATE INDEX idx_budgets_date_range ON budgets(start_date, end_date);
CREATE INDEX idx_budgets_tenant_period ON budgets(tenant_id, period_type);

-- ============================================================================
-- BUDGET CATEGORIES TABLE (Limits per category)
-- ============================================================================

CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES transaction_categories(id) ON DELETE CASCADE,
  limit_amount DECIMAL(12, 2) NOT NULL,
  alert_threshold INTEGER DEFAULT 80 CHECK (alert_threshold >= 0 AND alert_threshold <= 100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(budget_id, category_id),
  CONSTRAINT positive_category_limit CHECK (limit_amount >= 0)
);

-- Enable RLS
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policy for tenant isolation (via budget)
CREATE POLICY budget_categories_tenant_isolation ON budget_categories
  FOR ALL USING (
    budget_id IN (
      SELECT id FROM budgets WHERE tenant_id = get_current_tenant_id()
    )
  );

-- Indexes for performance
CREATE INDEX idx_budget_categories_budget ON budget_categories(budget_id);
CREATE INDEX idx_budget_categories_category ON budget_categories(category_id);
CREATE INDEX idx_budget_categories_budget_category ON budget_categories(budget_id, category_id);

-- ============================================================================
-- BUDGET PROGRESS VIEW (Real-time calculation)
-- ============================================================================

CREATE VIEW budget_progress AS
SELECT 
  b.id as budget_id,
  b.tenant_id,
  b.name as budget_name,
  b.period_type,
  b.start_date,
  b.end_date,
  b.total_limit,
  b.status,
  b.alert_threshold,
  b.rollover_enabled,
  COALESCE(SUM(fm.amount), 0) as spent_amount,
  b.total_limit - COALESCE(SUM(fm.amount), 0) as remaining,
  CASE 
    WHEN b.total_limit > 0 THEN (COALESCE(SUM(fm.amount), 0) / b.total_limit * 100)
    ELSE 0
  END as percentage_used,
  CASE 
    WHEN b.total_limit > 0 AND (COALESCE(SUM(fm.amount), 0) / b.total_limit * 100) >= b.alert_threshold 
    THEN true 
    ELSE false 
  END as alert_triggered,
  COUNT(fm.id) as transaction_count
FROM budgets b
LEFT JOIN budget_categories bc ON b.id = bc.budget_id
LEFT JOIN financial_movements fm ON fm.category_id = bc.category_id 
  AND fm.type = 'expense'
  AND fm.movement_date BETWEEN b.start_date AND b.end_date
WHERE b.status = 'active'
GROUP BY b.id, b.tenant_id, b.name, b.period_type, b.start_date, b.end_date, 
         b.total_limit, b.status, b.alert_threshold, b.rollover_enabled;

-- ============================================================================
-- BUDGET CATEGORY PROGRESS VIEW (Per category tracking)
-- ============================================================================

CREATE VIEW budget_category_progress AS
SELECT 
  bc.id as budget_category_id,
  bc.budget_id,
  bc.category_id,
  tc.name as category_name,
  tc.color as category_color,
  tc.icon as category_icon,
  bc.limit_amount,
  bc.alert_threshold as category_alert_threshold,
  COALESCE(SUM(fm.amount), 0) as spent_amount,
  bc.limit_amount - COALESCE(SUM(fm.amount), 0) as remaining,
  CASE 
    WHEN bc.limit_amount > 0 THEN (COALESCE(SUM(fm.amount), 0) / bc.limit_amount * 100)
    ELSE 0
  END as percentage_used,
  CASE 
    WHEN bc.limit_amount > 0 AND (COALESCE(SUM(fm.amount), 0) / bc.limit_amount * 100) >= bc.alert_threshold 
    THEN true 
    ELSE false 
  END as alert_triggered,
  COUNT(fm.id) as transaction_count
FROM budget_categories bc
JOIN budgets b ON bc.budget_id = b.id
JOIN transaction_categories tc ON bc.category_id = tc.id
LEFT JOIN financial_movements fm ON fm.category_id = bc.category_id 
  AND fm.type = 'expense'
  AND fm.movement_date BETWEEN b.start_date AND b.end_date
WHERE b.status = 'active'
GROUP BY bc.id, bc.budget_id, bc.category_id, tc.name, tc.color, tc.icon,
         bc.limit_amount, bc.alert_threshold;

-- ============================================================================
-- FUNCTION TO GET ACTIVE BUDGET FOR DATE
-- ============================================================================

CREATE OR REPLACE FUNCTION get_active_budget_for_date(
  p_tenant_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  period_type VARCHAR,
  start_date DATE,
  end_date DATE,
  total_limit DECIMAL,
  spent_amount DECIMAL,
  remaining DECIMAL,
  percentage_used DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.period_type,
    b.start_date,
    b.end_date,
    b.total_limit,
    bp.spent_amount,
    bp.remaining,
    bp.percentage_used
  FROM budgets b
  JOIN budget_progress bp ON b.id = bp.budget_id
  WHERE b.tenant_id = p_tenant_id
    AND b.status = 'active'
    AND p_date BETWEEN b.start_date AND b.end_date
  ORDER BY b.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION TO CREATE RECURRING BUDGET
-- ============================================================================

CREATE OR REPLACE FUNCTION create_recurring_budget(
  p_template_budget_id UUID,
  p_start_date DATE
)
RETURNS UUID AS $$
DECLARE
  v_new_budget_id UUID;
  v_budget_record RECORD;
  v_end_date DATE;
BEGIN
  -- Get template budget
  SELECT * INTO v_budget_record
  FROM budgets
  WHERE id = p_template_budget_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Budget template not found';
  END IF;

  -- Calculate end date based on period type
  CASE v_budget_record.period_type
    WHEN 'weekly' THEN
      v_end_date := p_start_date + INTERVAL '6 days';
    WHEN 'biweekly' THEN
      v_end_date := p_start_date + INTERVAL '13 days';
    WHEN 'monthly' THEN
      v_end_date := p_start_date + INTERVAL '1 month' - INTERVAL '1 day';
    ELSE
      v_end_date := v_budget_record.end_date - v_budget_record.start_date + p_start_date;
  END CASE;

  -- Create new budget
  INSERT INTO budgets (
    tenant_id,
    name,
    period_type,
    start_date,
    end_date,
    total_limit,
    currency,
    status,
    rollover_enabled,
    alert_threshold,
    notes
  ) VALUES (
    v_budget_record.tenant_id,
    v_budget_record.name,
    v_budget_record.period_type,
    p_start_date,
    v_end_date,
    v_budget_record.total_limit,
    v_budget_record.currency,
    'active',
    v_budget_record.rollover_enabled,
    v_budget_record.alert_threshold,
    v_budget_record.notes
  )
  RETURNING id INTO v_new_budget_id;

  -- Copy budget categories
  INSERT INTO budget_categories (
    budget_id,
    category_id,
    limit_amount,
    alert_threshold,
    notes
  )
  SELECT 
    v_new_budget_id,
    category_id,
    limit_amount,
    alert_threshold,
    notes
  FROM budget_categories
  WHERE budget_id = p_template_budget_id;

  RETURN v_new_budget_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER TO AUTO-CREATE NEXT BUDGET (Optional)
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_create_next_budget()
RETURNS TRIGGER AS $$
BEGIN
  -- If budget is ending tomorrow and rollover is enabled, create next period
  IF NEW.status = 'active' 
     AND NEW.rollover_enabled = true 
     AND NEW.end_date = CURRENT_DATE + INTERVAL '1 day' THEN
    
    PERFORM create_recurring_budget(NEW.id, NEW.end_date + INTERVAL '1 day');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (commented out by default - enable if needed)
-- CREATE TRIGGER trigger_auto_create_budget
--   BEFORE UPDATE ON budgets
--   FOR EACH ROW
--   EXECUTE FUNCTION auto_create_next_budget();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON budget_categories TO authenticated;
GRANT SELECT ON budget_progress TO authenticated;
GRANT SELECT ON budget_category_progress TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_budget_for_date TO authenticated;
GRANT EXECUTE ON FUNCTION create_recurring_budget TO authenticated;
