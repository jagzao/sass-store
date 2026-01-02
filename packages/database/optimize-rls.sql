-- ================================================================
-- OPTIMIZED RLS POLICIES - PERFORMANCE FIX
-- Replaces direct function calls with (select ...) to avoid row-by-row re-evaluation
-- WRAPPED IN TRANSACTION FOR SAFETY (Atomic Update)
-- ================================================================

BEGIN;

-- Drop Existing Policies (Safe re-entry)
DROP POLICY IF EXISTS tenant_isolation_products_select ON products;
DROP POLICY IF EXISTS tenant_isolation_products_insert ON products;
DROP POLICY IF EXISTS tenant_isolation_products_update ON products;
DROP POLICY IF EXISTS tenant_isolation_products_delete ON products;

DROP POLICY IF EXISTS tenant_isolation_services_select ON services;
DROP POLICY IF EXISTS tenant_isolation_services_insert ON services;
DROP POLICY IF EXISTS tenant_isolation_services_update ON services;
DROP POLICY IF EXISTS tenant_isolation_services_delete ON services;

DROP POLICY IF EXISTS tenant_isolation_staff_select ON staff;
DROP POLICY IF EXISTS tenant_isolation_staff_insert ON staff;
DROP POLICY IF EXISTS tenant_isolation_staff_update ON staff;
DROP POLICY IF EXISTS tenant_isolation_staff_delete ON staff;

DROP POLICY IF EXISTS tenant_isolation_bookings_select ON bookings;
DROP POLICY IF EXISTS tenant_isolation_bookings_insert ON bookings;
DROP POLICY IF EXISTS tenant_isolation_bookings_update ON bookings;
DROP POLICY IF EXISTS tenant_isolation_bookings_delete ON bookings;

DROP POLICY IF EXISTS tenant_isolation_orders_select ON orders;
DROP POLICY IF EXISTS tenant_isolation_orders_insert ON orders;
DROP POLICY IF EXISTS tenant_isolation_orders_update ON orders;
DROP POLICY IF EXISTS tenant_isolation_orders_delete ON orders;

DROP POLICY IF EXISTS tenant_isolation_payments_select ON payments;
DROP POLICY IF EXISTS tenant_isolation_payments_insert ON payments;
DROP POLICY IF EXISTS tenant_isolation_payments_update ON payments;
DROP POLICY IF EXISTS tenant_isolation_payments_delete ON payments;

-- Products
CREATE POLICY tenant_isolation_products_select ON products FOR SELECT
  USING (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_products_insert ON products FOR INSERT
  WITH CHECK (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_products_update ON products FOR UPDATE
  USING (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid))
  WITH CHECK (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_products_delete ON products FOR DELETE
  USING (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

-- Services
CREATE POLICY tenant_isolation_services_select ON services FOR SELECT
  USING (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_services_insert ON services FOR INSERT
  WITH CHECK (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_services_update ON services FOR UPDATE
  USING (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid))
  WITH CHECK (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_services_delete ON services FOR DELETE
  USING (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

-- Staff
CREATE POLICY tenant_isolation_staff_select ON staff FOR SELECT
  USING (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_staff_insert ON staff FOR INSERT
  WITH CHECK (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_staff_update ON staff FOR UPDATE
  USING (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid))
  WITH CHECK (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_staff_delete ON staff FOR DELETE
  USING (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

-- Bookings
CREATE POLICY tenant_isolation_bookings_select ON bookings FOR SELECT
  USING (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_bookings_insert ON bookings FOR INSERT
  WITH CHECK (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_bookings_update ON bookings FOR UPDATE
  USING (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid))
  WITH CHECK (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_bookings_delete ON bookings FOR DELETE
  USING (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

-- Orders
CREATE POLICY tenant_isolation_orders_select ON orders FOR SELECT
  USING (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_orders_insert ON orders FOR INSERT
  WITH CHECK (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_orders_update ON orders FOR UPDATE
  USING (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid))
  WITH CHECK (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_orders_delete ON orders FOR DELETE
  USING (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

-- Payments
CREATE POLICY tenant_isolation_payments_select ON payments FOR SELECT
  USING (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_payments_insert ON payments FOR INSERT
  WITH CHECK (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_payments_update ON payments FOR UPDATE
  USING (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid))
  WITH CHECK (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_payments_delete ON payments FOR DELETE
  USING (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

-- POS Terminals
DROP POLICY IF EXISTS tenant_isolation_pos_terminals_select ON pos_terminals;
DROP POLICY IF EXISTS tenant_isolation_pos_terminals_insert ON pos_terminals;
DROP POLICY IF EXISTS tenant_isolation_pos_terminals_update ON pos_terminals;
DROP POLICY IF EXISTS tenant_isolation_pos_terminals_delete ON pos_terminals;

CREATE POLICY tenant_isolation_pos_terminals_select ON pos_terminals FOR SELECT
  USING (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_pos_terminals_insert ON pos_terminals FOR INSERT
  WITH CHECK (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_pos_terminals_update ON pos_terminals FOR UPDATE
  USING (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid))
  WITH CHECK (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_pos_terminals_delete ON pos_terminals FOR DELETE
  USING (tenant_id = (select current_setting('app.current_tenant_id', TRUE)::uuid));

COMMIT;
