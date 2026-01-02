-- Update RLS policy for customers table to address performance issue
-- Replace current_setting() calls with subquery format to avoid row-by-row evaluation

-- Check current policies
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'customers';

-- Drop existing policies
DROP POLICY IF EXISTS tenant_isolation_customers_select ON customers;
DROP POLICY IF EXISTS tenant_isolation_customers_insert ON customers;
DROP POLICY IF EXISTS tenant_isolation_customers_update ON customers;
DROP POLICY IF EXISTS tenant_isolation_customers_delete ON customers;

-- Create new policies with subquery format for better performance
CREATE POLICY tenant_isolation_customers_select ON customers
  FOR SELECT
  USING (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_customers_insert ON customers
  FOR INSERT
  WITH CHECK (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_customers_update ON customers
  FOR UPDATE
  USING (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid))
  WITH CHECK (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

CREATE POLICY tenant_isolation_customers_delete ON customers
  FOR DELETE
  USING (tenant_id = (SELECT current_setting('app.current_tenant_id', TRUE)::uuid));

-- Verify the policies are created correctly
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'customers';