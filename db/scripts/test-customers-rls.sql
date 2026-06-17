-- Test script to verify the RLS policy for customers table is working correctly

-- 1. First, let's check the current policies on the customers table
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'customers';

-- 2. Check if the table exists and has the expected structure
\d customers

-- 3. Test setting a tenant context (this would normally be done by the application)
-- For testing purposes, we'll set a mock tenant ID
SET app.current_tenant_id TO '12345678-1234-1234-1234-123456789012';

-- 4. If the table has data, try to query it (this should work if RLS is properly configured)
-- This will only return rows where tenant_id matches the one set above
SELECT * FROM customers LIMIT 10;

-- 5. Test that we can insert data (this should work if RLS INSERT policy is properly configured)
-- This will only succeed if the tenant_id matches the one set above
-- INSERT INTO customers (tenant_id, name, phone, email, status) 
-- VALUES ('12345678-1234-1234-1234-123456789012', 'Test Customer', '1234567890', 'test@example.com', 'active');

-- 6. Reset the setting
RESET app.current_tenant_id;