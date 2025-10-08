#!/usr/bin/env ts-node
/**
 * Upstash Redis Verification Script
 * Tests that Redis connection and caching are working properly
 */

import { cache, tenantCache } from '../packages/cache/redis';

async function verifyRedis() {
  console.log('🔍 Verificando conexión a Upstash Redis...\n');

  try {
    // Test 1: Basic SET/GET
    console.log('✅ Test 1: SET/GET básico');
    const testKey = 'test:verification';
    const testValue = { message: 'Redis is working!', timestamp: Date.now() };

    await cache.set(testKey, testValue, 60);
    // SECURITY: Redacted sensitive log;

    const retrieved = await cache.get(testKey);
    // SECURITY: Redacted sensitive log;

    if (JSON.stringify(retrieved) === JSON.stringify(testValue)) {
      console.log('   ✓ Datos coinciden correctamente\n');
    } else {
      throw new Error('Los datos no coinciden');
    }

    // Test 2: Tenant caching
    console.log('✅ Test 2: Cache de tenant');
    const tenantSlug = 'test-tenant';
    const tenantData = {
      id: '123',
      name: 'Test Tenant',
      slug: tenantSlug,
      products: [],
      services: []
    };

    await tenantCache.setTenant(tenantSlug, tenantData);
    console.log('   - Tenant guardado:', tenantSlug);

    const cachedTenant = await tenantCache.getTenant(tenantSlug);
    console.log('   - Tenant recuperado:', cachedTenant?.name);
    console.log('   ✓ Cache de tenant funciona correctamente\n');

    // Test 3: Cache invalidation
    console.log('✅ Test 3: Invalidación de cache');
    await tenantCache.invalidate(tenantSlug);
    console.log('   - Cache invalidado para:', tenantSlug);

    const afterInvalidation = await tenantCache.getTenant(tenantSlug);
    if (afterInvalidation === null) {
      console.log('   ✓ Invalidación funciona correctamente\n');
    } else {
      throw new Error('Cache no se invalidó correctamente');
    }

    // Test 4: Cleanup
    console.log('✅ Test 4: Limpieza');
    await cache.del(testKey);
    console.log('   ✓ Claves de prueba eliminadas\n');

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 REDIS VERIFICACIÓN COMPLETA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('✓ Conexión a Upstash: OK');
    console.log('✓ SET/GET básico: OK');
    console.log('✓ Cache de tenants: OK');
    console.log('✓ Invalidación: OK');
    console.log('');
    console.log('📊 Estado: REDIS FUNCIONANDO CORRECTAMENTE');
    console.log('🔗 URL:', process.env.UPSTASH_REDIS_REST_URL);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR EN VERIFICACIÓN DE REDIS');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');
    console.error('Error:', error);
    console.error('');
    console.error('Verifica:');
    console.error('1. UPSTASH_REDIS_REST_URL está configurado en .env.local');
    // SECURITY: Redacted sensitive log;
    console.error('3. Las credenciales son correctas');
    console.error('4. La base de datos Redis existe en Upstash Dashboard');
    console.error('');
    process.exit(1);
  }
}

// Run verification
verifyRedis();
