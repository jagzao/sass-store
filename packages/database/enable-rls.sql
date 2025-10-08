-- ================================================================
-- Row Level Security (RLS) Policies for Multi-Tenant Isolation
-- CRITICAL: Prevents data leakage between tenants
-- ================================================================

-- Enable RLS on all multi-tenant tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- RLS Policies for Products
-- ================================================================

-- Policy: Users can only view products from their tenant
CREATE POLICY tenant_isolation_products_select ON products
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

-- Policy: Users can only insert products for their tenant
CREATE POLICY tenant_isolation_products_insert ON products
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

-- Policy: Users can only update products from their tenant
CREATE POLICY tenant_isolation_products_update ON products
  FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

-- Policy: Users can only delete products from their tenant
CREATE POLICY tenant_isolation_products_delete ON products
  FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

-- ================================================================
-- RLS Policies for Services
-- ================================================================

CREATE POLICY tenant_isolation_services_select ON services
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_services_insert ON services
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_services_update ON services
  FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_services_delete ON services
  FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

-- ================================================================
-- RLS Policies for Staff
-- ================================================================

CREATE POLICY tenant_isolation_staff_select ON staff
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_staff_insert ON staff
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_staff_update ON staff
  FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_staff_delete ON staff
  FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

-- ================================================================
-- RLS Policies for Appointments
-- ================================================================

CREATE POLICY tenant_isolation_appointments_select ON appointments
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_appointments_insert ON appointments
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_appointments_update ON appointments
  FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_appointments_delete ON appointments
  FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

-- ================================================================
-- RLS Policies for Users
-- ================================================================

CREATE POLICY tenant_isolation_users_select ON users
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_users_insert ON users
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_users_update ON users
  FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_users_delete ON users
  FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

-- ================================================================
-- RLS Policies for Cart Items
-- ================================================================

CREATE POLICY tenant_isolation_cart_items_select ON cart_items
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_cart_items_insert ON cart_items
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_cart_items_update ON cart_items
  FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_cart_items_delete ON cart_items
  FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

-- ================================================================
-- RLS Policies for Orders
-- ================================================================

CREATE POLICY tenant_isolation_orders_select ON orders
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_orders_insert ON orders
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_orders_update ON orders
  FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_orders_delete ON orders
  FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

-- ================================================================
-- RLS Policies for Order Items
-- ================================================================

CREATE POLICY tenant_isolation_order_items_select ON order_items
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_order_items_insert ON order_items
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_order_items_update ON order_items
  FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_order_items_delete ON order_items
  FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

-- ================================================================
-- RLS Policies for Payments
-- ================================================================

CREATE POLICY tenant_isolation_payments_select ON payments
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_payments_insert ON payments
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_payments_update ON payments
  FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_payments_delete ON payments
  FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

-- ================================================================
-- Helper Function: Set Tenant Context
-- ================================================================

CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_uuid::text, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- Helper Function: Get Current Tenant
-- ================================================================

CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS uuid AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', TRUE)::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- Usage Example:
-- ================================================================
-- -- Set tenant context before queries:
-- SELECT set_tenant_context('tenant-uuid-here');
--
-- -- Now all queries respect RLS:
-- SELECT * FROM products; -- Only returns products for current tenant
-- ================================================================
