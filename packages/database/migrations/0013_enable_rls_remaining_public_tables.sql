-- Migration: Ensure RLS is enabled for remaining public tables flagged by Supabase
-- Description: Fix security warnings "RLS Disabled in Public"
-- Created: 2026-02-14

-- 1) mercadopago_tokens
ALTER TABLE IF EXISTS public.mercadopago_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'mercadopago_tokens'
      AND policyname = 'mercadopago_tokens_tenant_isolation'
  ) THEN
    CREATE POLICY mercadopago_tokens_tenant_isolation
      ON public.mercadopago_tokens
      FOR ALL
      USING (tenant_id = get_current_tenant_id())
      WITH CHECK (tenant_id = get_current_tenant_id());
  END IF;
END
$$;

-- 2) pos_terminals
ALTER TABLE IF EXISTS public.pos_terminals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pos_terminals'
      AND policyname = 'pos_terminals_tenant_isolation'
  ) THEN
    CREATE POLICY pos_terminals_tenant_isolation
      ON public.pos_terminals
      FOR ALL
      USING (tenant_id = get_current_tenant_id())
      WITH CHECK (tenant_id = get_current_tenant_id());
  END IF;
END
$$;

-- 3) service_retouch_config
ALTER TABLE IF EXISTS public.service_retouch_config ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'service_retouch_config'
      AND policyname = 'tenant_isolation_service_retouch_config'
  ) THEN
    CREATE POLICY tenant_isolation_service_retouch_config
      ON public.service_retouch_config
      FOR ALL
      TO authenticated
      USING (tenant_id = (SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::UUID))
      WITH CHECK (tenant_id = (SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::UUID));
  END IF;
END
$$;
