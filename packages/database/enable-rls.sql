-- ================================================================
-- Row Level Security (RLS) Policies for Multi-Tenant Isolation
-- CRITICAL: Prevents data leakage between tenants
-- This script is now idempotent and can be run multiple times.
-- ================================================================

-- ================================================================
-- Drop Existing Policies to ensure a clean slate
-- ================================================================

-- Products
DROP POLICY IF EXISTS tenant_isolation_products_select ON products;
DROP POLICY IF EXISTS tenant_isolation_products_insert ON products;
DROP POLICY IF EXISTS tenant_isolation_products_update ON products;
DROP POLICY IF EXISTS tenant_isolation_products_delete ON products;

-- Services
DROP POLICY IF EXISTS tenant_isolation_services_select ON services;
DROP POLICY IF EXISTS tenant_isolation_services_insert ON services;
DROP POLICY IF EXISTS tenant_isolation_services_update ON services;
DROP POLICY IF EXISTS tenant_isolation_services_delete ON services;

-- Staff
DROP POLICY IF EXISTS tenant_isolation_staff_select ON staff;
DROP POLICY IF EXISTS tenant_isolation_staff_insert ON staff;
DROP POLICY IF EXISTS tenant_isolation_staff_update ON staff;
DROP POLICY IF EXISTS tenant_isolation_staff_delete ON staff;

-- Bookings
DROP POLICY IF EXISTS tenant_isolation_bookings_select ON bookings;
DROP POLICY IF EXISTS tenant_isolation_bookings_insert ON bookings;
DROP POLICY IF EXISTS tenant_isolation_bookings_update ON bookings;
DROP POLICY IF EXISTS tenant_isolation_bookings_delete ON bookings;

-- Orders
DROP POLICY IF EXISTS tenant_isolation_orders_select ON orders;
DROP POLICY IF EXISTS tenant_isolation_orders_insert ON orders;
DROP POLICY IF EXISTS tenant_isolation_orders_update ON orders;
DROP POLICY IF EXISTS tenant_isolation_orders_delete ON orders;

-- Payments
DROP POLICY IF EXISTS tenant_isolation_payments_select ON payments;
DROP POLICY IF EXISTS tenant_isolation_payments_insert ON payments;
DROP POLICY IF EXISTS tenant_isolation_payments_update ON payments;
DROP POLICY IF EXISTS tenant_isolation_payments_delete ON payments;


-- ================================================================
-- Enable RLS on all multi-tenant tables
-- ================================================================

ALTER TABLE products FORCE ROW LEVEL SECURITY;
ALTER TABLE services FORCE ROW LEVEL SECURITY;
ALTER TABLE staff FORCE ROW LEVEL SECURITY;
ALTER TABLE bookings FORCE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;

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

CREATE POLICY tenant_isolation_bookings_select ON bookings
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_bookings_insert ON bookings
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_bookings_update ON bookings
  FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

CREATE POLICY tenant_isolation_bookings_delete ON bookings
  FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::uuid);

-- ================================================================
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