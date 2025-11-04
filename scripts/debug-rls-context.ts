#!/usr/bin/env node
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { db } from '../packages/database';
import { sql } from 'drizzle-orm';

async function debugRLS() {
  console.log('🔍 Debugging RLS Context\n');

  // Check current user and role
  const userInfo: any = await db.execute(sql`SELECT current_user, current_database(), session_user`);
  console.log('Current user:', userInfo[0]);

  // Check if RLS is enabled on products table
  const rlsStatus: any = await db.execute(sql`
    SELECT schemaname, tablename, rowsecurity
    FROM pg_tables
    WHERE tablename = 'products'
  `);
  console.log('\nRLS status on products:', rlsStatus[0]);

  // Check existing policies
  const policies: any = await db.execute(sql`
    SELECT policyname, cmd, qual
    FROM pg_policies
    WHERE tablename = 'products'
    LIMIT 5
  `);
  console.log('\nPolicies on products:');
  policies.forEach((p: any) => console.log('  -', p));

  // Try to set context manually
  console.log('\n🔧 Testing context setting...');
  await db.execute(sql`SELECT set_config('app.current_tenant_id', '833e18a5-4f97-4291-93f3-3287cceccd5c', FALSE)`);

  const contextCheck: any = await db.execute(sql`SELECT current_setting('app.current_tenant_id', true) as tenant_id`);
  console.log('Context after setting:', contextCheck[0]);

  // Try a simple query
  const testQuery: any = await db.execute(sql`SELECT COUNT(*) as count FROM products`);
  console.log('Product count after setting context:', testQuery[0]);

  // Check if function exists
  const funcCheck: any = await db.execute(sql`
    SELECT proname, prosrc
    FROM pg_proc
    WHERE proname = 'get_current_tenant_id'
  `);
  console.log('\nFunction get_current_tenant_id:', funcCheck[0] ? 'EXISTS' : 'NOT FOUND');
  if (funcCheck[0]) {
    console.log('Function source:', funcCheck[0].prosrc);
  }

  // Test the function
  try {
    const funcTest: any = await db.execute(sql`SELECT get_current_tenant_id() as result`);
    console.log('Function test result:', funcTest[0]);
  } catch (error) {
    console.error('Function test failed:', error);
  }
}

debugRLS().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
