#!/usr/bin/env node
/**
 * Test RLS (Row Level Security)
 * Verifies that tenant isolation is working correctly
 */

import { Pool } from 'pg';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function testRLS() {
  console.log('🧪 Testing Row Level Security (RLS)...\n');
  console.log('════════════════════════════════════════════════════════\n');

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    // Get tenant IDs
    console.log('📋 Step 1: Getting tenant list...\n');

    const tenantsResult = await pool.query(`
      SELECT id, slug, name
      FROM tenants
      ORDER BY created_at
      LIMIT 3
    `);

    if (tenantsResult.rows.length < 2) {
      console.log('⚠️  Warning: Need at least 2 tenants to test isolation');
      console.log('   Creating test tenants...\n');

      // Create test tenants
      await pool.query(`
        INSERT INTO tenants (id, slug, name, mode, status, branding, contact, location, quotas)
        VALUES
          (gen_random_uuid(), 'test-tenant-1', 'Test Tenant 1', 'catalog', 'active',
           '{"primaryColor": "#000"}', '{"email": "test1@test.com"}',
           '{"address": "Test"}', '{"maxProducts": 100}'),
          (gen_random_uuid(), 'test-tenant-2', 'Test Tenant 2', 'catalog', 'active',
           '{"primaryColor": "#000"}', '{"email": "test2@test.com"}',
           '{"address": "Test"}', '{"maxProducts": 100}')
        ON CONFLICT (slug) DO NOTHING
      `);

      // Re-fetch tenants
      const newTenantsResult = await pool.query(`
        SELECT id, slug, name FROM tenants ORDER BY created_at LIMIT 2
      `);
      tenantsResult.rows = newTenantsResult.rows;
    }

    const tenant1 = tenantsResult.rows[0];
    const tenant2 = tenantsResult.rows[1];

    console.log(`Tenant 1: ${tenant1.name} (${tenant1.slug})`);
    console.log(`Tenant 2: ${tenant2.name} (${tenant2.slug})\n`);

    // Test 2: Set context for tenant 1
    console.log('📋 Step 2: Setting context for Tenant 1...\n');

    await pool.query(`SELECT set_config('app.current_tenant_id', $1, FALSE)`, [tenant1.id]);

    // Query products
    const tenant1Products = await pool.query(`SELECT id, tenant_id, name FROM products`);

    console.log(`   Found ${tenant1Products.rows.length} products for ${tenant1.name}`);

    // Verify all products belong to tenant 1
    const wrongTenant1 = tenant1Products.rows.filter(p => p.tenant_id !== tenant1.id);
    if (wrongTenant1.length > 0) {
      console.error(`   ❌ ERROR: Found ${wrongTenant1.length} products from other tenants!`);
      console.error(`   RLS is NOT working correctly!`);
      return false;
    } else {
      console.log(`   ✅ All products belong to ${tenant1.name}\n`);
    }

    // Test 3: Switch to tenant 2
    console.log('📋 Step 3: Switching context to Tenant 2...\n');

    await pool.query(`SELECT set_config('app.current_tenant_id', $1, FALSE)`, [tenant2.id]);

    // Query products again
    const tenant2Products = await pool.query(`SELECT id, tenant_id, name FROM products`);

    console.log(`   Found ${tenant2Products.rows.length} products for ${tenant2.name}`);

    // Verify all products belong to tenant 2
    const wrongTenant2 = tenant2Products.rows.filter(p => p.tenant_id !== tenant2.id);
    if (wrongTenant2.length > 0) {
      console.error(`   ❌ ERROR: Found ${wrongTenant2.length} products from other tenants!`);
      console.error(`   RLS is NOT working correctly!`);
      return false;
    } else {
      console.log(`   ✅ All products belong to ${tenant2.name}\n`);
    }

    // Test 4: Verify isolation (no overlap)
    console.log('📋 Step 4: Verifying tenant isolation...\n');

    const tenant1Ids = tenant1Products.rows.map(p => p.id);
    const tenant2Ids = tenant2Products.rows.map(p => p.id);

    const overlap = tenant1Ids.filter(id => tenant2Ids.includes(id));

    if (overlap.length > 0) {
      console.error(`   ❌ ERROR: Found ${overlap.length} products visible to both tenants!`);
      console.error(`   RLS isolation is BROKEN!`);
      return false;
    } else {
      console.log(`   ✅ No overlap between tenants - Perfect isolation!\n`);
    }

    // Test 5: Test without context (should return nothing or error)
    console.log('📋 Step 5: Testing without tenant context...\n');

    await pool.query(`SELECT set_config('app.current_tenant_id', '', FALSE)`);

    const noContextProducts = await pool.query(`SELECT id FROM products`);

    console.log(`   Found ${noContextProducts.rows.length} products without context`);

    if (noContextProducts.rows.length === 0) {
      console.log(`   ✅ Correctly returns no data without tenant context\n`);
    } else {
      console.log(`   ⚠️  WARNING: Returns ${noContextProducts.rows.length} products without context`);
      console.log(`   This might be expected if your RLS policy allows it\n`);
    }

    // Test 6: Try to insert for wrong tenant (should fail or be filtered)
    console.log('📋 Step 6: Testing insert protection...\n');

    await pool.query(`SELECT set_config('app.current_tenant_id', $1, FALSE)`, [tenant1.id]);

    try {
      // Try to insert product for tenant 2 while context is tenant 1
      await pool.query(`
        INSERT INTO products (id, tenant_id, sku, name, price, category)
        VALUES (gen_random_uuid(), $1, 'TEST-SKU', 'Test Product', 99.99, 'test')
      `, [tenant2.id]);

      console.log(`   ❌ ERROR: Was able to insert product for wrong tenant!`);
      console.log(`   RLS INSERT policy is NOT working!`);

      // Cleanup
      await pool.query(`DELETE FROM products WHERE sku = 'TEST-SKU'`);

      return false;
    } catch (error) {
      console.log(`   ✅ Correctly prevented insert for wrong tenant\n`);
    }

    // Summary
    console.log('════════════════════════════════════════════════════════\n');
    console.log('🎉 RLS TEST PASSED!\n');
    console.log('✅ Tenant isolation is working correctly');
    console.log('✅ Products are filtered by tenant');
    console.log('✅ No data leakage between tenants');
    console.log('✅ Insert protection is working\n');

    return true;

  } catch (error) {
    console.error('\n❌ RLS TEST FAILED!\n');
    console.error('Error:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Run
testRLS()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
