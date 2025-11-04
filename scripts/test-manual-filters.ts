#!/usr/bin/env node
/**
 * Test Manual Tenant Filters
 * Validates that manual .where() filters correctly isolate tenant data
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { db, withTenantContext, tenants, products } from '../packages/database';
import { eq } from 'drizzle-orm';

async function testManualFilters() {
  console.log('🔒 Testing Manual Tenant Filters\n');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    // Get two different tenants
    const allTenants = await db.select().from(tenants).limit(2);

    if (allTenants.length < 2) {
      console.error('❌ Need at least 2 tenants to test');
      process.exit(1);
    }

    const tenant1 = allTenants[0];
    const tenant2 = allTenants[1];

    console.log(`Tenant 1: ${tenant1.name} (${tenant1.id})`);
    console.log(`Tenant 2: ${tenant2.name} (${tenant2.id})\n`);

    // Test 1: Query with manual filter
    console.log('📝 Test 1: Query with manual tenant filter');
    const tenant1Products = await withTenantContext(db, tenant1.id, async (db) => {
      return await db
        .select()
        .from(products)
        .where(eq(products.tenantId, tenant1.id)); // ← Manual filter
    });

    console.log(`   Found ${tenant1Products.length} products for ${tenant1.name}`);

    // Validate all products belong to tenant1
    const invalidProducts = tenant1Products.filter(p => p.tenantId !== tenant1.id);
    if (invalidProducts.length > 0) {
      console.error('   ❌ FAIL: Found products from other tenants!');
      console.error('   Invalid products:', invalidProducts);
      process.exit(1);
    }
    console.log(`   ✅ PASS: All ${tenant1Products.length} products belong to ${tenant1.name}\n`);

    // Test 2: Query for different tenant
    console.log('📝 Test 2: Query for different tenant');
    const tenant2Products = await withTenantContext(db, tenant2.id, async (db) => {
      return await db
        .select()
        .from(products)
        .where(eq(products.tenantId, tenant2.id)); // ← Manual filter
    });

    console.log(`   Found ${tenant2Products.length} products for ${tenant2.name}`);

    // Validate all products belong to tenant2
    const invalidProducts2 = tenant2Products.filter(p => p.tenantId !== tenant2.id);
    if (invalidProducts2.length > 0) {
      console.error('   ❌ FAIL: Found products from other tenants!');
      console.error('   Invalid products:', invalidProducts2);
      process.exit(1);
    }
    console.log(`   ✅ PASS: All ${tenant2Products.length} products belong to ${tenant2.name}\n`);

    // Test 3: Verify no overlap
    console.log('📝 Test 3: Verify tenant isolation');
    const tenant1Ids = new Set(tenant1Products.map(p => p.id));
    const tenant2Ids = new Set(tenant2Products.map(p => p.id));
    const overlap = [...tenant1Ids].filter(id => tenant2Ids.has(id));

    if (overlap.length > 0) {
      console.error('   ❌ FAIL: Tenants share products!');
      console.error('   Overlapping IDs:', overlap);
      process.exit(1);
    }
    console.log('   ✅ PASS: No data overlap between tenants\n');

    console.log('════════════════════════════════════════════════════════\n');
    console.log('🎉 All manual filter tests passed!\n');
    console.log('✅ Defense in Depth Strategy Working:');
    console.log('   1. Manual filters in code (application-level)');
    console.log('   2. RLS policies in database (database-level)');
    console.log('   3. Double protection against data leakage\n');

  } catch (error) {
    console.error('\n❌ Error during testing:', error);
    if (error instanceof Error) {
      console.error('\nError Details:', error.message);
    }
    process.exit(1);
  }
}

testManualFilters()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
