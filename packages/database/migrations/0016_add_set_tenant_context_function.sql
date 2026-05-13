-- Migration: Create set_tenant_context function for RLS
-- Description: Establishes a session-level tenant context used by RLS policies
-- to enforce row-level security per tenant.

-- Create the function if it does not exist (idempotent)
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', p_tenant_id::text, false);
END;
$$;

-- Create get_tenant_context helper (used by some RLS policies)
CREATE OR REPLACE FUNCTION get_tenant_context()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id TEXT;
BEGIN
  v_tenant_id := current_setting('app.current_tenant_id', true);
  IF v_tenant_id IS NULL OR v_tenant_id = '' THEN
    RETURN NULL;
  END IF;
  RETURN v_tenant_id::UUID;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION set_tenant_context(UUID) IS
  'Sets the current tenant UUID in the session configuration variable app.current_tenant_id. Used by RLS policies for tenant isolation.';

COMMENT ON FUNCTION get_tenant_context() IS
  'Returns the current tenant UUID from the session configuration variable app.current_tenant_id. Returns NULL if not set.';
