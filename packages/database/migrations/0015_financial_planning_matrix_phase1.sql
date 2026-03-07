-- Migration: Financial Planning Matrix Phase 1 (backend + data)
-- Description: Adds financial_planning_cells and extends financial_movements
-- Created: 2026-02-21

-- ============================================================================
-- EXTEND FINANCIAL MOVEMENTS (idempotent)
-- ============================================================================

ALTER TABLE IF EXISTS public.financial_movements
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.transaction_categories(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS fecha_programada DATE,
  ADD COLUMN IF NOT EXISTS fecha_pago DATE,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20);

-- Backfill defaults for existing rows
UPDATE public.financial_movements
SET
  fecha_programada = COALESCE(fecha_programada, movement_date),
  status = COALESCE(status, CASE WHEN fecha_pago IS NOT NULL THEN 'paid' ELSE 'pending' END)
WHERE fecha_programada IS NULL OR status IS NULL;

ALTER TABLE public.financial_movements
  ALTER COLUMN fecha_programada SET NOT NULL,
  ALTER COLUMN fecha_programada SET DEFAULT CURRENT_DATE,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'pending';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'financial_movements_status_check'
  ) THEN
    ALTER TABLE public.financial_movements
      ADD CONSTRAINT financial_movements_status_check
      CHECK (status IN ('pending', 'paid', 'cancelled'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_financial_movements_tenant_category_date
  ON public.financial_movements(tenant_id, category_id, movement_date);

CREATE INDEX IF NOT EXISTS idx_financial_movements_tenant_scheduled_date
  ON public.financial_movements(tenant_id, fecha_programada);

CREATE INDEX IF NOT EXISTS idx_financial_movements_tenant_paid_date
  ON public.financial_movements(tenant_id, fecha_pago);

CREATE INDEX IF NOT EXISTS idx_financial_movements_tenant_entity_date
  ON public.financial_movements(tenant_id, entity_id, movement_date);

-- ============================================================================
-- FINANCIAL PLANNING CELLS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.financial_planning_cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.transaction_categories(id) ON DELETE CASCADE,
  bucket_id VARCHAR(64) NOT NULL,
  bucket_type VARCHAR(20) NOT NULL,
  bucket_start_date DATE NOT NULL,
  bucket_end_date DATE NOT NULL,
  projected_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  real_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  entity_id UUID,
  notes TEXT,
  is_over_budget BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT financial_planning_cells_bucket_type_check
    CHECK (bucket_type IN ('week', 'fortnight', 'month', 'year')),
  CONSTRAINT financial_planning_cells_amounts_check
    CHECK (projected_amount >= 0 AND real_amount >= 0),
  CONSTRAINT financial_planning_cells_range_check
    CHECK (bucket_end_date >= bucket_start_date)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'financial_planning_cells_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX financial_planning_cells_unique_idx
      ON public.financial_planning_cells(tenant_id, category_id, bucket_id, bucket_type, entity_id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_financial_planning_cells_tenant
  ON public.financial_planning_cells(tenant_id);

CREATE INDEX IF NOT EXISTS idx_financial_planning_cells_category
  ON public.financial_planning_cells(category_id);

CREATE INDEX IF NOT EXISTS idx_financial_planning_cells_entity
  ON public.financial_planning_cells(entity_id);

CREATE INDEX IF NOT EXISTS idx_financial_planning_cells_tenant_category_range
  ON public.financial_planning_cells(tenant_id, category_id, bucket_start_date, bucket_end_date);

CREATE INDEX IF NOT EXISTS idx_financial_planning_cells_tenant_entity_range
  ON public.financial_planning_cells(tenant_id, entity_id, bucket_start_date, bucket_end_date);

CREATE INDEX IF NOT EXISTS idx_financial_planning_cells_tenant_bucket_type_range
  ON public.financial_planning_cells(tenant_id, bucket_type, bucket_start_date, bucket_end_date);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE IF EXISTS public.financial_planning_cells ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'financial_planning_cells'
      AND policyname = 'financial_planning_cells_tenant_isolation'
  ) THEN
    CREATE POLICY financial_planning_cells_tenant_isolation
      ON public.financial_planning_cells
      FOR ALL
      USING (tenant_id = get_current_tenant_id())
      WITH CHECK (tenant_id = get_current_tenant_id());
  END IF;
END
$$;

-- Ensure financial_movements has WITH CHECK in policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'financial_movements'
      AND policyname = 'financial_movements_tenant_isolation'
      AND with_check IS NULL
  ) THEN
    DROP POLICY financial_movements_tenant_isolation ON public.financial_movements;

    CREATE POLICY financial_movements_tenant_isolation
      ON public.financial_movements
      FOR ALL
      USING (tenant_id = get_current_tenant_id())
      WITH CHECK (tenant_id = get_current_tenant_id());
  END IF;
END
$$;
