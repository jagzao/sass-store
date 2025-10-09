-- Enable Row Level Security for Multi-Tenant Isolation
-- Generated: 2025-10-08
-- OWASP A01: Broken Access Control - CRITICAL FIX

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

-- Tenants table (admin only access)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Products table (tenant-isolated)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Services table (tenant-isolated)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Staff table (tenant-isolated)
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Bookings table (tenant-isolated)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Media table (tenant-isolated)
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Orders table (tenant-isolated)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Order items table (tenant-isolated via orders)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Social planner tables (tenant-isolated)
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_campaigns ENABLE ROW LEVEL SECURITY;

-- Users tables (global but with tenant association)
-- Note: users table is shared across tenants via next-auth
-- We use tenant_users junction table for isolation

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Helper function to get current tenant from session
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  -- This will be set by application context
  -- In Next.js, set via SET LOCAL app.current_tenant = 'tenant-uuid'
  RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TENANTS TABLE POLICIES
-- ============================================================================

-- Admin can read all tenants
CREATE POLICY tenant_read_all ON tenants
  FOR SELECT
  USING (
    -- Allow if user is system admin (check via custom role)
    current_setting('app.user_role', true) = 'admin'
    OR
    -- Allow reading own tenant
    id = get_current_tenant_id()
  );

-- Only admins can create tenants
CREATE POLICY tenant_insert_admin ON tenants
  FOR INSERT
  WITH CHECK (
    current_setting('app.user_role', true) = 'admin'
  );

-- Tenants can update their own data
CREATE POLICY tenant_update_own ON tenants
  FOR UPDATE
  USING (id = get_current_tenant_id());

-- ============================================================================
-- PRODUCTS TABLE POLICIES
-- ============================================================================

-- Users can read products from their tenant
CREATE POLICY product_read_own_tenant ON products
  FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- Users can insert products into their tenant
CREATE POLICY product_insert_own_tenant ON products
  FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

-- Users can update products in their tenant
CREATE POLICY product_update_own_tenant ON products
  FOR UPDATE
  USING (tenant_id = get_current_tenant_id());

-- Users can delete products in their tenant
CREATE POLICY product_delete_own_tenant ON products
  FOR DELETE
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- SERVICES TABLE POLICIES
-- ============================================================================

CREATE POLICY service_read_own_tenant ON services
  FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY service_insert_own_tenant ON services
  FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY service_update_own_tenant ON services
  FOR UPDATE
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY service_delete_own_tenant ON services
  FOR DELETE
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- STAFF TABLE POLICIES
-- ============================================================================

CREATE POLICY staff_read_own_tenant ON staff
  FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY staff_insert_own_tenant ON staff
  FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY staff_update_own_tenant ON staff
  FOR UPDATE
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY staff_delete_own_tenant ON staff
  FOR DELETE
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- BOOKINGS TABLE POLICIES
-- ============================================================================

CREATE POLICY booking_read_own_tenant ON bookings
  FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY booking_insert_own_tenant ON bookings
  FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY booking_update_own_tenant ON bookings
  FOR UPDATE
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY booking_delete_own_tenant ON bookings
  FOR DELETE
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- MEDIA TABLE POLICIES
-- ============================================================================

CREATE POLICY media_read_own_tenant ON media
  FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY media_insert_own_tenant ON media
  FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY media_update_own_tenant ON media
  FOR UPDATE
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY media_delete_own_tenant ON media
  FOR DELETE
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- ORDERS TABLE POLICIES
-- ============================================================================

CREATE POLICY order_read_own_tenant ON orders
  FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY order_insert_own_tenant ON orders
  FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY order_update_own_tenant ON orders
  FOR UPDATE
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- ORDER_ITEMS TABLE POLICIES
-- ============================================================================

-- Order items are accessed via their parent order
CREATE POLICY order_item_read_via_order ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY order_item_insert_via_order ON order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY order_item_update_via_order ON order_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.tenant_id = get_current_tenant_id()
    )
  );

-- ============================================================================
-- SOCIAL PLANNER POLICIES
-- ============================================================================

CREATE POLICY social_post_read_own_tenant ON social_posts
  FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY social_post_insert_own_tenant ON social_posts
  FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY social_post_update_own_tenant ON social_posts
  FOR UPDATE
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY social_post_delete_own_tenant ON social_posts
  FOR DELETE
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY social_account_read_own_tenant ON social_accounts
  FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY social_account_insert_own_tenant ON social_accounts
  FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY social_account_update_own_tenant ON social_accounts
  FOR UPDATE
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY social_account_delete_own_tenant ON social_accounts
  FOR DELETE
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY social_campaign_read_own_tenant ON social_campaigns
  FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY social_campaign_insert_own_tenant ON social_campaigns
  FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY social_campaign_update_own_tenant ON social_campaigns
  FOR UPDATE
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY social_campaign_delete_own_tenant ON social_campaigns
  FOR DELETE
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute on helper function to authenticated users
GRANT EXECUTE ON FUNCTION get_current_tenant_id() TO authenticated;

-- ============================================================================
-- TESTING QUERIES (commented out - for reference)
-- ============================================================================

-- Test setting tenant context:
-- SET LOCAL app.current_tenant_id = 'your-tenant-uuid-here';

-- Test querying with RLS enabled:
-- SELECT * FROM products; -- Should only return products for current tenant

-- Verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- View all policies:
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
