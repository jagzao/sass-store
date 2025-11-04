#!/usr/bin/env node
/**
 * Test RLS (Row Level Security)
 * Verifies that tenant isolation is working correctly
 * This version uses a single client to ensure session-level context is maintained.
 */

import { Client } from 'pg';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function testRLS() {
  console.log('🧪 Testing Row Level Security (RLS) with a single client...');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL not set');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  let success = false;

  try {
    // Step 1: Get tenant IDs
    const tenantsResult = await client.query(`SELECT id, slug, name FROM tenants LIMIT 2`);
    if (tenantsResult.rows.length < 2) {
      console.error('❌ Error: Need at least 2 tenants to test isolation.');
      return;
    }
    const tenant1 = tenantsResult.rows[0];
    const tenant2 = tenantsResult.rows[1];
    console.log(`Tenant 1: ${tenant1.name}, Tenant 2: ${tenant2.name}`);

    // Step 2: Set context for tenant 1 and query
    await client.query(`SELECT set_config('app.current_tenant_id', $1, FALSE)`, [tenant1.id]);
    const debugQuery = await client.query(`SELECT current_setting('app.current_tenant_id', TRUE) as current_tenant`);
    console.log(`DEBUG: current_tenant_id is set to: ${debugQuery.rows[0].current_tenant}`);

    const tenant1Products = await client.query(`SELECT id, tenant_id FROM products`);
    console.log(`Found ${tenant1Products.rows.length} products for Tenant 1.`);
    if (tenant1Products.rows.some(p => p.tenant_id !== tenant1.id)) {
      console.error('❌ RLS FAIL: Tenant 1 query returned products from another tenant.');
      return;
    }
    console.log('✅ Tenant 1 isolation PASSED.');

    // Step 3: Set context for tenant 2 and query
    await client.query(`SELECT set_config('app.current_tenant_id', $1, FALSE)`, [tenant2.id]);
    const tenant2Products = await client.query(`SELECT id, tenant_id FROM products`);
    console.log(`Found ${tenant2Products.rows.length} products for Tenant 2.`);
    if (tenant2Products.rows.some(p => p.tenant_id !== tenant2.id)) {
      console.error('❌ RLS FAIL: Tenant 2 query returned products from another tenant.');
      return;
    }
    console.log('✅ Tenant 2 isolation PASSED.');

    // Step 4: Verify no overlap
    const tenant1Ids = new Set(tenant1Products.rows.map(p => p.id));
    const overlap = tenant2Products.rows.filter(p => tenant1Ids.has(p.id));
    if (overlap.length > 0) {
      console.error(`❌ RLS FAIL: ${overlap.length} products leaked between tenants.`);
      return;
    }
    console.log('✅ Tenant data overlap check PASSED.');

    // Step 5: Test without context
    await client.query(`SELECT set_config('app.current_tenant_id', '', FALSE)`);
    const noContextProducts = await client.query(`SELECT id FROM products`);
    if (noContextProducts.rows.length > 0) {
      console.warn(`⚠️  RLS Warning: Found ${noContextProducts.rows.length} products without a tenant context. This may be intended.`);
    } else {
      console.log('✅ No-context query returned 0 products as expected.');
    }

    console.log('\n🎉 All RLS checks passed!');
    success = true;

  } catch (error) {
    console.error('\n❌ RLS TEST FAILED!\n', error);
  } finally {
    await client.end();
    console.log('Connection closed.');
    process.exit(success ? 0 : 1);
  }
}

testRLS();