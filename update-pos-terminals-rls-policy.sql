-- Update RLS policy for pos_terminals table to address performance issue
-- Replace current_setting() calls with subquery format to avoid row-by-row evaluation

-- Check current policies
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'pos_terminals';

-- Drop existing policy (the one created via migration)
DROP POLICY IF EXISTS pos_terminals_tenant_isolation ON pos_terminals;

-- Create new policy with subquery format for better performance
CREATE POLICY pos_terminals_tenant_isolation ON pos_terminals
  FOR ALL 
  USING (tenant_id = (SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::UUID));

-- Verify the policy is created correctly
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'pos_terminals';

-- Also update the policies that might have been created by apply-rls.ts script
DROP POLICY IF EXISTS tenant_isolation_pos_terminals_select ON pos_terminals;
DROP POLICY IF EXISTS tenant_isolation_pos_terminals_insert ON pos_terminals;
DROP POLICY IF EXISTS tenant_isolation_pos_terminals_update ON pos_terminals;
DROP POLICY IF EXISTS tenant_isolation_pos_terminals_delete ON pos_terminals;

-- Recreate with proper subquery format
CREATE POLICY tenant_isolation_pos_terminals_select ON pos_terminals
  FOR SELECT
  USING (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_pos_terminals_insert ON pos_terminals
  FOR INSERT
  WITH CHECK (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_pos_terminals_update ON pos_terminals
  FOR UPDATE
  USING (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid))
  WITH CHECK (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_pos_terminals_delete ON pos_terminals
  FOR DELETE
  USING (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

-- Final verification
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'pos_terminals';