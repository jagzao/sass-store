-- Migration: Ensure RLS is enabled for financial_movements
-- Description: Fix Supabase security warning "RLS Disabled in Public"
-- Created: 2026-02-14

-- Enable RLS (idempotent)
ALTER TABLE IF EXISTS public.financial_movements ENABLE ROW LEVEL SECURITY;

-- Ensure tenant isolation policy exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'financial_movements'
      AND policyname = 'financial_movements_tenant_isolation'
  ) THEN
    CREATE POLICY financial_movements_tenant_isolation
      ON public.financial_movements
      FOR ALL
      USING (tenant_id = get_current_tenant_id())
      WITH CHECK (tenant_id = get_current_tenant_id());
  END IF;
END
$$;
