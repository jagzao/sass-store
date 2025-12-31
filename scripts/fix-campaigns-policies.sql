-- Migration: Fix campaigns RLS policies for tenant isolation
-- Description: Replace overly permissive policies with proper tenant isolation
-- Date: 2025-12-30
-- 
-- PROBLEM: Current policies allow any authenticated user to access ALL campaigns
-- RISK: Users from Tenant A could access/modify/delete campaigns from Tenant B
-- SOLUTION: Create proper tenant isolation policies

-- ============================================
-- STEP 1: Drop overly permissive policies
-- ============================================

DROP POLICY IF EXISTS campaigns_anon_read ON public.campaigns;
DROP POLICY IF EXISTS campaigns_authenticated_all ON public.campaigns;

-- Note: We keep campaigns_service_role_all as service_role needs full access

-- ============================================
-- STEP 2: Create proper tenant isolation policies
-- ============================================

-- Policy for authenticated users: Only access their own tenant's campaigns
-- This assumes campaigns table has a tenant_id column
-- If your table uses a different column name, adjust accordingly

CREATE POLICY campaigns_authenticated_select ON public.campaigns
    FOR SELECT
    TO authenticated
    USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

CREATE POLICY campaigns_authenticated_insert ON public.campaigns
    FOR INSERT
    TO authenticated
    WITH CHECK (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

CREATE POLICY campaigns_authenticated_update ON public.campaigns
    FOR UPDATE
    TO authenticated
    USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid)
    WITH CHECK (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

CREATE POLICY campaigns_authenticated_delete ON public.campaigns
    FOR DELETE
    TO authenticated
    USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid);

-- ============================================
-- STEP 3: Verify policies were created
-- ============================================

-- Run this to verify:
SELECT 
    policyname,
    permissive AS is_permissive,
    roles,
    cmd AS command,
    qual AS using_expression,
    with_check AS check_expression
FROM pg_policies
WHERE tablename = 'campaigns'
ORDER BY policyname;

-- Expected output should show:
-- - campaigns_authenticated_select (SELECT, authenticated)
-- - campaigns_authenticated_insert (INSERT, authenticated)
-- - campaigns_authenticated_update (UPDATE, authenticated)
-- - campaigns_authenticated_delete (DELETE, authenticated)
-- - campaigns_service_role_all (ALL, service_role)

-- ============================================
-- IMPORTANT: Before enabling RLS
-- ============================================

-- 1. Verify your campaigns table has a tenant_id column:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'campaigns'
  AND column_name = 'tenant_id';

-- If tenant_id doesn't exist, you need to:
-- ALTER TABLE public.campaigns ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- 2. Verify your app sets the tenant context:
-- Your middleware should set: SET LOCAL app.current_tenant_id = '<tenant_id>';

-- 3. Test with a real JWT token from your app to verify isolation works

-- ============================================
-- ROLLBACK (if needed)
-- ============================================

-- To revert these changes and restore original policies:

-- DROP POLICY IF EXISTS campaigns_authenticated_select ON public.campaigns;
-- DROP POLICY IF EXISTS campaigns_authenticated_insert ON public.campaigns;
-- DROP POLICY IF EXISTS campaigns_authenticated_update ON public.campaigns;
-- DROP POLICY IF EXISTS campaigns_authenticated_delete ON public.campaigns;

-- Then recreate original policies:
-- CREATE POLICY campaigns_anon_read ON public.campaigns
--     FOR SELECT
--     TO anon
--     USING (true);
-- 
-- CREATE POLICY campaigns_authenticated_all ON public.campaigns
--     FOR ALL
--     TO authenticated
--     USING (true)
--     WITH CHECK (true);
