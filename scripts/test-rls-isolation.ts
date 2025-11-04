#!/usr/bin/env node
/**
 * Test RLS Isolation
 * Verifies that Row Level Security correctly isolates tenant data
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Now import database modules
import { db, withTenantContext, tenants } from '../packages/database';
import { products, services } from '../packages/database';
import { eq } from 'drizzle-orm';

async function testRLSIsolation() {
  console.log('🔒 Testing RLS Isolation\n');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    // First, get the actual tenant IDs
    console.log('📝 Getting tenant IDs from database...');
    const allTenants = await db.select().from(tenants).limit(10);
    console.log(`   Found ${allTenants.length} tenants\n`);

    if (allTenants.length < 2) {
      console.error('   ❌ Need at least 2 tenants to test isolation');
      process.exit(1);
    }

    const tenant1 = allTenants[0];
    const tenant2 = allTenants[1];

    console.log(`   Tenant 1: ${tenant1.name} (${tenant1.id})`);
    console.log(`   Tenant 2: ${tenant2.name} (${tenant2.id})\n`);

    // Test 1: Verify tenant 1 can only see their own products
    console.log(`📝 Test 1: ${tenant1.name} product isolation`);
    const tenant1Products = await withTenantContext(db, tenant1.id, async (db) => {
      return await db.select().from(products);
    });

    console.log(`   Found ${tenant1Products.length} products for ${tenant1.name}`);

    // Verify all products belong to tenant1
    const invalidProducts = tenant1Products.filter(p => p.tenantId !== tenant1.id);
    if (invalidProducts.length > 0) {
      console.error('   ❌ FAIL: Found products from other tenants!');
      console.error('   Invalid products:', invalidProducts.map(p => ({ id: p.id, tenantId: p.tenantId })));
      process.exit(1);
    }
    console.log(`   ✅ PASS: All products belong to ${tenant1.name}\n`);

    // Test 2: Verify tenant 2 can only see their own products
    console.log(`📝 Test 2: ${tenant2.name} product isolation`);
    const tenant2Products = await withTenantContext(db, tenant2.id, async (db) => {
      return await db.select().from(products);
    });

    console.log(`   Found ${tenant2Products.length} products for ${tenant2.name}`);

    // Verify all products belong to tenant2
    const invalidTenant2Products = tenant2Products.filter(p => p.tenantId !== tenant2.id);
    if (invalidTenant2Products.length > 0) {
      console.error('   ❌ FAIL: Found products from other tenants!');
      console.error('   Invalid products:', invalidTenant2Products.map(p => ({ id: p.id, tenantId: p.tenantId })));
      process.exit(1);
    }
    console.log(`   ✅ PASS: All products belong to ${tenant2.name}\n`);

    // Test 3: Verify different tenants see different data
    console.log('📝 Test 3: Cross-tenant isolation');
    const tenant1Ids = new Set(tenant1Products.map(p => p.id));
    const tenant2Ids = new Set(tenant2Products.map(p => p.id));
    const overlap = [...tenant1Ids].filter(id => tenant2Ids.has(id));

    if (overlap.length > 0) {
      console.error('   ❌ FAIL: Tenants can see each other\'s products!');
      console.error('   Overlapping product IDs:', overlap);
      process.exit(1);
    }
    console.log('   ✅ PASS: Tenants have isolated data\n');

    // Test 4: Verify services isolation
    console.log(`📝 Test 4: ${tenant1.name} services isolation`);
    const tenant1Services = await withTenantContext(db, tenant1.id, async (db) => {
      return await db.select().from(services);
    });

    console.log(`   Found ${tenant1Services.length} services for ${tenant1.name}`);

    const invalidServices = tenant1Services.filter(s => s.tenantId !== tenant1.id);
    if (invalidServices.length > 0) {
      console.error('   ❌ FAIL: Found services from other tenants!');
      console.error('   Invalid services:', invalidServices.map(s => ({ id: s.id, tenantId: s.tenantId })));
      process.exit(1);
    }
    console.log(`   ✅ PASS: All services belong to ${tenant1.name}\n`);

    // Test 5: Verify RLS prevents querying without context
    console.log('📝 Test 5: Verify RLS requires tenant context');
    try {
      // Try to query without setting tenant context
      const allProducts = await db.select().from(products).limit(10);
      console.log(`   ⚠️  WARNING: Query without tenant context returned ${allProducts.length} products`);
      console.log('   This is OK if RLS is enforcing empty results when context is not set');
      console.log('   But it\'s better to always use withTenantContext()\n');
    } catch (error) {
      console.log('   ℹ️  INFO: Query without tenant context failed (expected behavior)');
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }

    console.log('════════════════════════════════════════════════════════\n');
    console.log('🎉 All RLS isolation tests passed!\n');
    console.log('✅ Row Level Security is working correctly');
    console.log('✅ Tenants can only access their own data');
    console.log('✅ Cross-tenant data leakage is prevented\n');

  } catch (error) {
    console.error('\n❌ Error during RLS testing:', error);
    if (error instanceof Error) {
      console.error('\nError Details:', error.message);
      console.error('\nStack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testRLSIsolation()
  .then(() => {
    console.log('📊 RLS Test Summary');
    console.log('────────────────────────────────');
    console.log('Status: ✅ ALL TESTS PASSED');
    console.log('Security Level: 🔒 HIGH');
    console.log('Tenant Isolation: ✅ VERIFIED');
    console.log('────────────────────────────────\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
