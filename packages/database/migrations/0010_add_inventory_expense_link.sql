-- Migration: Add Inventory-Expense Link
-- Description: Creates inventory_expense_links table and adds fields to products for supply tracking
-- Created: 2026-02-13

-- ============================================================================
-- ADD SUPPLY FIELDS TO PRODUCTS TABLE
-- ============================================================================

ALTER TABLE products 
ADD COLUMN is_supply BOOLEAN DEFAULT false,
ADD COLUMN expense_category_id UUID REFERENCES transaction_categories(id),
ADD COLUMN auto_create_expense BOOLEAN DEFAULT true,
ADD COLUMN expense_description_template TEXT DEFAULT 'Compra: {product_name}';

-- Index for supply products lookup
CREATE INDEX idx_products_is_supply ON products(is_supply) WHERE is_supply = true;
CREATE INDEX idx_products_expense_category ON products(expense_category_id);

-- ============================================================================
-- INVENTORY EXPENSE LINKS TABLE
-- ============================================================================

CREATE TABLE inventory_expense_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  inventory_transaction_id UUID NOT NULL REFERENCES inventory_transactions(id) ON DELETE CASCADE,
  financial_movement_id UUID REFERENCES financial_movements(id) ON DELETE SET NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_cost DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'adjusted')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT positive_cost CHECK (unit_cost >= 0 AND total_cost >= 0)
);

-- Enable RLS
ALTER TABLE inventory_expense_links ENABLE ROW LEVEL SECURITY;

-- RLS Policy for tenant isolation
CREATE POLICY inventory_expense_links_tenant_isolation ON inventory_expense_links
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Indexes for performance
CREATE INDEX idx_inventory_expense_links_tenant ON inventory_expense_links(tenant_id);
CREATE INDEX idx_inventory_expense_links_product ON inventory_expense_links(product_id);
CREATE INDEX idx_inventory_expense_links_transaction ON inventory_expense_links(inventory_transaction_id);
CREATE INDEX idx_inventory_expense_links_movement ON inventory_expense_links(financial_movement_id);
CREATE INDEX idx_inventory_expense_links_status ON inventory_expense_links(status);

-- Unique constraint to prevent duplicate links
CREATE UNIQUE INDEX idx_inventory_expense_links_unique 
ON inventory_expense_links(inventory_transaction_id) 
WHERE status = 'active';

-- ============================================================================
-- FUNCTION TO AUTO-CREATE EXPENSE FROM INVENTORY PURCHASE
-- ============================================================================

CREATE OR REPLACE FUNCTION create_expense_from_inventory()
RETURNS TRIGGER AS $$
DECLARE
  v_product RECORD;
  v_category_id UUID;
  v_total_cost DECIMAL(10, 2);
  v_expense_description TEXT;
  v_financial_movement_id UUID;
  v_link_id UUID;
BEGIN
  -- Only process 'addition' type transactions (purchases)
  IF NEW.type != 'addition' THEN
    RETURN NEW;
  END IF;

  -- Get product details
  SELECT * INTO v_product
  FROM products
  WHERE id = NEW.product_id;

  -- Only process if product is marked as supply
  IF NOT v_product.is_supply OR v_product.is_supply IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determine expense category
  v_category_id := v_product.expense_category_id;
  
  -- If no specific category, use 'Insumos' category or first expense category
  IF v_category_id IS NULL THEN
    SELECT id INTO v_category_id
    FROM transaction_categories
    WHERE tenant_id = NEW.tenant_id
      AND type = 'expense'
      AND name ILIKE '%insumos%'
    LIMIT 1;
    
    -- Fallback to any expense category
    IF v_category_id IS NULL THEN
      SELECT id INTO v_category_id
      FROM transaction_categories
      WHERE tenant_id = NEW.tenant_id
        AND type = 'expense'
      LIMIT 1;
    END IF;
  END IF;

  -- Calculate total cost
  v_total_cost := NEW.quantity * COALESCE(NEW.unit_cost, 0);
  
  IF v_total_cost <= 0 THEN
    RETURN NEW;
  END IF;

  -- Build description
  v_expense_description := REPLACE(
    COALESCE(v_product.expense_description_template, 'Compra: {product_name}'),
    '{product_name}',
    v_product.name
  );

  -- Create financial movement (expense)
  INSERT INTO financial_movements (
    tenant_id,
    type,
    amount,
    movement_date,
    description,
    category_id,
    reference_id,
    counterparty,
    payment_method,
    reconciled
  ) VALUES (
    NEW.tenant_id,
    'expense',
    v_total_cost,
    NEW.created_at::DATE,
    v_expense_description,
    v_category_id,
    NEW.id::TEXT,
    'Inventario',
    'transfer', -- Default payment method for inventory purchases
    false
  )
  RETURNING id INTO v_financial_movement_id;

  -- Create link record
  INSERT INTO inventory_expense_links (
    tenant_id,
    product_id,
    inventory_transaction_id,
    financial_movement_id,
    quantity,
    unit_cost,
    total_cost,
    status,
    notes
  ) VALUES (
    NEW.tenant_id,
    NEW.product_id,
    NEW.id,
    v_financial_movement_id,
    NEW.quantity,
    COALESCE(NEW.unit_cost, 0),
    v_total_cost,
    'active',
    'Auto-generated from inventory transaction'
  )
  RETURNING id INTO v_link_id;

  -- Log the action
  RAISE NOTICE 'Created expense % for inventory transaction %, link: %', 
    v_financial_movement_id, NEW.id, v_link_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER TO AUTO-CREATE EXPENSE ON INVENTORY ADDITION
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_auto_expense_on_inventory ON inventory_transactions;

CREATE TRIGGER trigger_auto_expense_on_inventory
  AFTER INSERT ON inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_expense_from_inventory();

-- ============================================================================
-- FUNCTION TO CANCEL EXPENSE WHEN INVENTORY TRANSACTION IS CANCELLED
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_expense_on_inventory_cancel()
RETURNS TRIGGER AS $$
DECLARE
  v_link RECORD;
BEGIN
  -- Only process if transaction type changed to 'adjustment' (cancellation)
  IF NEW.type = 'adjustment' AND OLD.type != 'adjustment' THEN
    -- Find and update the link
    UPDATE inventory_expense_links
    SET 
      status = 'cancelled',
      notes = COALESCE(notes, '') || ' | Cancelled on ' || NOW(),
      updated_at = NOW()
    WHERE inventory_transaction_id = NEW.id
      AND status = 'active';

    -- Optionally, you could also mark the financial movement as cancelled
    -- UPDATE financial_movements 
    -- SET reconciled = true, description = description || ' [CANCELADO]'
    -- WHERE id IN (
    --   SELECT financial_movement_id 
    --   FROM inventory_expense_links 
    --   WHERE inventory_transaction_id = NEW.id
    -- );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for cancellation
DROP TRIGGER IF EXISTS trigger_cancel_expense_on_inventory_cancel ON inventory_transactions;

CREATE TRIGGER trigger_cancel_expense_on_inventory_cancel
  AFTER UPDATE ON inventory_transactions
  FOR EACH ROW
  WHEN (OLD.type IS DISTINCT FROM NEW.type)
  EXECUTE FUNCTION cancel_expense_on_inventory_cancel();

-- ============================================================================
-- VIEW FOR INVENTORY EXPENSE REPORT
-- ============================================================================

CREATE VIEW inventory_expense_report AS
SELECT 
  iel.id as link_id,
  iel.tenant_id,
  iel.product_id,
  p.name as product_name,
  p.sku as product_sku,
  tc.name as expense_category,
  tc.color as category_color,
  iel.inventory_transaction_id,
  it.type as transaction_type,
  it.reference_type,
  iel.financial_movement_id,
  fm.movement_date as expense_date,
  fm.description as expense_description,
  iel.quantity,
  iel.unit_cost,
  iel.total_cost,
  iel.status as link_status,
  iel.created_at,
  iel.updated_at
FROM inventory_expense_links iel
JOIN products p ON iel.product_id = p.id
JOIN inventory_transactions it ON iel.inventory_transaction_id = it.id
LEFT JOIN financial_movements fm ON iel.financial_movement_id = fm.id
LEFT JOIN transaction_categories tc ON fm.category_id = tc.id
WHERE iel.status = 'active';

-- ============================================================================
-- FUNCTION TO GET SUPPLY EXPENSES SUMMARY
-- ============================================================================

CREATE OR REPLACE FUNCTION get_supply_expenses_summary(
  p_tenant_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR,
  category_name VARCHAR,
  total_quantity DECIMAL,
  total_cost DECIMAL,
  transaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    iel.product_id,
    p.name::VARCHAR,
    tc.name::VARCHAR as category_name,
    SUM(iel.quantity) as total_quantity,
    SUM(iel.total_cost) as total_cost,
    COUNT(*) as transaction_count
  FROM inventory_expense_links iel
  JOIN products p ON iel.product_id = p.id
  LEFT JOIN financial_movements fm ON iel.financial_movement_id = fm.id
  LEFT JOIN transaction_categories tc ON fm.category_id = tc.id
  WHERE iel.tenant_id = p_tenant_id
    AND iel.status = 'active'
    AND (p_start_date IS NULL OR fm.movement_date >= p_start_date)
    AND (p_end_date IS NULL OR fm.movement_date <= p_end_date)
  GROUP BY iel.product_id, p.name, tc.name
  ORDER BY SUM(iel.total_cost) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON inventory_expense_links TO authenticated;
GRANT SELECT ON inventory_expense_report TO authenticated;
GRANT EXECUTE ON FUNCTION get_supply_expenses_summary TO authenticated;

-- ============================================================================
-- HELPER FUNCTION TO CONVERT EXISTING PRODUCTS TO SUPPLIES
-- ============================================================================

CREATE OR REPLACE FUNCTION convert_product_to_supply(
  p_product_id UUID,
  p_expense_category_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET 
    is_supply = true,
    expense_category_id = COALESCE(p_expense_category_id, expense_category_id),
    updated_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION convert_product_to_supply TO authenticated;
