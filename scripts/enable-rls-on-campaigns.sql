-- Migration: Enable RLS on campaigns table
-- Description: Enable Row Level Security on public.campaigns table
--              This fixes the issue where RLS policies exist but are not enforced
-- Date: 2025-12-30
-- Issue: Table public.campaigns has RLS policies but RLS is not enabled on the table

-- ============================================
-- Enable RLS on campaigns table
-- ============================================
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Verify existing policies
-- ============================================
-- This query shows the current policies on the campaigns table
-- Run this to verify the policies are correct after enabling RLS

-- SELECT 
--     schemaname,
--     tablename,
--     policyname,
--     permissive,
--     roles,
--     cmd,
--     qual,
--     with_check
-- FROM pg_policies
-- WHERE tablename = 'campaigns';

-- ============================================
-- Expected policies on campaigns table:
-- ============================================
-- 1. campaigns_anon_read - Allows anonymous users to read campaigns
-- 2. campaigns_authenticated_all - Allows authenticated users full access
-- 3. campaigns_service_role_all - Allows service role full access

-- ============================================
-- Note: If policies need to be adjusted, you can use:
-- ============================================

-- Example: Drop a policy
-- DROP POLICY IF EXISTS campaigns_anon_read ON public.campaigns;

-- Example: Create a new policy
-- CREATE POLICY campaigns_tenant_isolation ON public.campaigns
--     FOR ALL
--     TO authenticated
--     USING (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid))
--     WITH CHECK (tenant_id = (SELECT current_setting('app.current_tenant_id')::uuid));

-- ============================================
-- Recommended indexes for performance
-- ============================================
-- If your policies use tenant_id or user_id columns, consider adding indexes:

-- CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_id ON public.campaigns(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);

-- ============================================
-- Verification after migration
-- ============================================
-- Check that RLS is enabled
-- SELECT relname, relrowsecurity 
-- FROM pg_class 
-- WHERE relname = 'campaigns';

-- Expected output: relrowsecurity = true

-- ============================================
-- Rollback (if needed)
-- ============================================
-- To disable RLS on this table:
-- ALTER TABLE public.campaigns DISABLE ROW LEVEL SECURITY;
