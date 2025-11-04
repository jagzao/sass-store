#!/usr/bin/env node
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { db } from '../packages/database';
import { sql } from 'drizzle-orm';

async function testTransactionContext() {
  console.log('🔍 Testing Transaction Context\n');

  // Test 1: Set context outside transaction
  console.log('Test 1: Context outside transaction');
  await db.execute(sql`SELECT set_config('app.current_tenant_id', '833e18a5-4f97-4291-93f3-3287cceccd5c', TRUE)`);
  const ctx1: any = await db.execute(sql`SELECT current_setting('app.current_tenant_id', true) as tenant_id`);
  console.log('  Context:', ctx1[0]?.tenant_id);
  const count1: any = await db.execute(sql`SELECT COUNT(*) FROM products`);
  console.log('  Product count:', count1[0]?.count, '\n');

  // Test 2: Set context inside transaction
  console.log('Test 2: Context inside transaction');
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_tenant_id', '833e18a5-4f97-4291-93f3-3287cceccd5c', TRUE)`);
    const ctx2: any = await tx.execute(sql`SELECT current_setting('app.current_tenant_id', true) as tenant_id`);
    console.log('  Context in transaction:', ctx2[0]?.tenant_id);
    const count2: any = await tx.execute(sql`SELECT COUNT(*) FROM products`);
    console.log('  Product count in transaction:', count2[0]?.count);
  });

  console.log('\n✅ Test complete');
}

testTransactionContext().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
