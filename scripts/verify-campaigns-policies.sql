-- Script: Verify campaigns table RLS policies
-- Description: Review existing RLS policies on campaigns table before enabling RLS
-- Date: 2025-12-30

-- ============================================
-- Check if RLS is currently enabled
-- ============================================
SELECT 
    relname AS table_name,
    relrowsecurity AS rls_enabled,
    relforcerowsecurity AS rls_forced
FROM pg_class 
WHERE relname = 'campaigns';

-- Expected output:
-- table_name | rls_enabled | rls_forced
-- campaigns  | false       | false
-- (This confirms RLS is currently disabled)

-- ============================================
-- List all policies on campaigns table
-- ============================================
SELECT 
    schemaname,
    tablename,
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
-- - campaigns_anon_read
-- - campaigns_authenticated_all
-- - campaigns_service_role_all

-- ============================================
-- Check table structure
-- ============================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'campaigns'
ORDER BY ordinal_position;

-- ============================================
-- Check if tenant_id and user_id columns exist
-- (Important for RLS policies)
-- ============================================
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'campaigns'
  AND column_name IN ('tenant_id', 'user_id', 'owner_id', 'created_by');

-- ============================================
-- Check existing indexes
-- ============================================
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'campaigns'
  AND schemaname = 'public';

-- ============================================
-- Check current grants/permissions
-- ============================================
SELECT 
    grantee,
    privilege_type,
    table_name
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'campaigns'
ORDER BY grantee, privilege_type;

-- ============================================
-- Recommendations after review:
-- ============================================
-- 1. If policies look correct, run: ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
-- 2. If policies need adjustment, modify them before enabling RLS
-- 3. If tenant_id/user_id columns exist and are used in policies, ensure indexes exist
-- 4. Test access with anon, authenticated, and service_role roles after enabling RLS
