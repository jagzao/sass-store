-- Enable Row Level Security for Multi-Tenant Isolation
-- Version 2 - Adapted to actual schema
-- Generated: 2025-10-09
-- OWASP A01: Broken Access Control - CRITICAL FIX

-- ============================================================================
-- ENABLE RLS ON EXISTING TABLES
-- ============================================================================

-- Core tenant tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Reviews
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Media
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_renditions ENABLE ROW LEVEL SECURITY;

-- Social/Content
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_results ENABLE ROW LEVEL SECURITY;

-- Channel management
ALTER TABLE channel_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_rules ENABLE ROW LEVEL SECURITY;

-- Audit and quotas
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_quotas ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS HELPER FUNCTION
-- ============================================================================

-- Drop existing function if it exists (handles type changes)
DROP FUNCTION IF EXISTS get_current_tenant_id();

CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS TEXT AS $$
BEGIN
  -- This will be set by application context
  -- In Next.js, set via SET LOCAL app.current_tenant_id = 'tenant-id'
  RETURN NULLIF(current_setting('app.current_tenant_id', true), '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TENANTS TABLE POLICIES
-- ============================================================================

CREATE POLICY tenant_read_all ON tenants
  FOR SELECT
  USING (true);

CREATE POLICY tenant_insert_admin ON tenants
  FOR INSERT
  WITH CHECK (current_setting('app.user_role', true) = 'admin');

CREATE POLICY tenant_update_own ON tenants
  FOR UPDATE
  USING (id = get_current_tenant_id());

-- ============================================================================
-- PRODUCTS TABLE POLICIES
-- ============================================================================

CREATE POLICY product_read_own_tenant ON products
  FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY product_insert_own_tenant ON products
  FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY product_update_own_tenant ON products
  FOR UPDATE
  USING (tenant_id = get_current_tenant_id());

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
-- ORDERS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS order_read_own_tenant ON orders;
CREATE POLICY order_read_policy ON orders
  FOR SELECT
  USING (
    tenant_id = get_current_tenant_id() AND
    (
      -- Admins/Managers can see all orders in the tenant
      current_setting('app.user_role', true) IN ('Administrador', 'Gerente')
      OR
      -- Clients can only see their own orders
      (current_setting('app.user_role', true) = 'Cliente' AND user_id = current_setting('app.current_user_id', true))
    )
  );

CREATE POLICY order_insert_own_tenant ON orders
  FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY order_update_own_tenant ON orders
  FOR UPDATE
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- ORDER_ITEMS TABLE POLICIES (via parent order)
-- ============================================================================

CREATE POLICY order_item_read_via_order ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        -- The policy on the orders table already checks tenant_id and role
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
-- PAYMENTS TABLE POLICIES
-- ============================================================================

CREATE POLICY payment_read_own_tenant ON payments
  FOR SELECT
  USING (
    tenant_id = get_current_tenant_id() AND
    current_setting('app.user_role', true) IN ('Administrador', 'Gerente')
  );

CREATE POLICY payment_insert_own_tenant ON payments
  FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY payment_update_own_tenant ON payments
  FOR UPDATE
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- PRODUCT_REVIEWS TABLE POLICIES
-- ============================================================================

CREATE POLICY review_read_own_tenant ON product_reviews
  FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY review_insert_own_tenant ON product_reviews
  FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY review_update_own_tenant ON product_reviews
  FOR UPDATE
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY review_delete_own_tenant ON product_reviews
  FOR DELETE
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- MEDIA ASSETS TABLE POLICIES
-- ============================================================================

CREATE POLICY media_asset_read_own_tenant ON media_assets
  FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY media_asset_insert_own_tenant ON media_assets
  FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY media_asset_update_own_tenant ON media_assets
  FOR UPDATE
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY media_asset_delete_own_tenant ON media_assets
  FOR DELETE
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- MEDIA RENDITIONS TABLE POLICIES
-- ============================================================================

CREATE POLICY media_rendition_read_via_asset ON media_renditions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM media_assets
      WHERE media_assets.id = media_renditions.asset_id
        AND media_assets.tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY media_rendition_insert_via_asset ON media_renditions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM media_assets
      WHERE media_assets.id = media_renditions.asset_id
        AND media_assets.tenant_id = get_current_tenant_id()
    )
  );

-- ============================================================================
-- SOCIAL POSTS TABLE POLICIES
-- ============================================================================

CREATE POLICY social_post_read_own_tenant ON social_posts
  FOR SELECT
  USING (
    tenant_id = get_current_tenant_id() AND
    current_setting('app.user_role', true) IN ('Administrador', 'Gerente')
  );

CREATE POLICY social_post_insert_own_tenant ON social_posts
  FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY social_post_update_own_tenant ON social_posts
  FOR UPDATE
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY social_post_delete_own_tenant ON social_posts
  FOR DELETE
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- CONTENT VARIANTS TABLE POLICIES
-- ============================================================================

CREATE POLICY content_variant_read_via_post ON content_variants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM social_posts
      WHERE social_posts.id = content_variants.post_id
        AND social_posts.tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY content_variant_insert_via_post ON content_variants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM social_posts
      WHERE social_posts.id = content_variants.post_id
        AND social_posts.tenant_id = get_current_tenant_id()
    )
  );

-- ============================================================================
-- CHANNEL & POSTING POLICIES
-- ============================================================================

CREATE POLICY channel_account_read_own_tenant ON channel_accounts
  FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY channel_account_insert_own_tenant ON channel_accounts
  FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY tenant_channel_read_own_tenant ON tenant_channels
  FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY posting_rule_read_own_tenant ON posting_rules
  FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- AUDIT & QUOTAS POLICIES
-- ============================================================================

CREATE POLICY audit_log_read_own_tenant ON audit_logs
  FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY audit_log_insert_own_tenant ON audit_logs
  FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY quota_read_own_tenant ON tenant_quotas
  FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY quota_update_own_tenant ON tenant_quotas
  FOR UPDATE
  USING (tenant_id = get_current_tenant_id());

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_tenant_id() TO anon;
