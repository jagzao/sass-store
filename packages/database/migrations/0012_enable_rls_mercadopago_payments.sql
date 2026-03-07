-- Migration: Ensure RLS is enabled for mercadopago_payments
-- Description: Fix Supabase security warning "RLS Disabled in Public"
-- Created: 2026-02-14

-- Enable RLS (idempotent)
ALTER TABLE IF EXISTS public.mercadopago_payments ENABLE ROW LEVEL SECURITY;

-- Ensure tenant isolation policy exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'mercadopago_payments'
      AND policyname = 'mercadopago_payments_tenant_isolation'
  ) THEN
    CREATE POLICY mercadopago_payments_tenant_isolation
      ON public.mercadopago_payments
      FOR ALL
      USING (tenant_id = get_current_tenant_id())
      WITH CHECK (tenant_id = get_current_tenant_id());
  END IF;
END
$$;
