-- Migration: Ensure RLS is enabled for tenant_holidays and tenant_configs
-- Description: Fix Supabase security warnings "RLS Disabled in Public"
-- Created: 2026-02-14

-- 1) tenant_holidays
ALTER TABLE IF EXISTS public.tenant_holidays ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tenant_holidays'
      AND policyname = 'tenant_isolation_tenant_holidays'
  ) THEN
    CREATE POLICY tenant_isolation_tenant_holidays
      ON public.tenant_holidays
      FOR ALL
      TO authenticated
      USING (tenant_id = (SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::UUID))
      WITH CHECK (tenant_id = (SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::UUID));
  END IF;
END
$$;

-- 2) tenant_configs
ALTER TABLE IF EXISTS public.tenant_configs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tenant_configs'
      AND policyname = 'tenant_configs_tenant_isolation'
  ) THEN
    CREATE POLICY tenant_configs_tenant_isolation
      ON public.tenant_configs
      FOR ALL
      USING (tenant_id = get_current_tenant_id())
      WITH CHECK (tenant_id = get_current_tenant_id());
  END IF;
END
$$;
