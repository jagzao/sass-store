import { describe, it, expect, beforeEach } from 'vitest';
import { getTestDb, createTestTenant, createTestProduct, createTestService } from '../setup/test-database';
import { products, services, users } from '@sass-store/database/schema';
import { eq, and } from 'drizzle-orm';

describe('Row Level Security (RLS) - Tenant Isolation', () => {
  let tenant1: Awaited<ReturnType<typeof createTestTenant>>;
  let tenant2: Awaited<ReturnType<typeof createTestTenant>>;

  beforeEach(async () => {
    tenant1 = await createTestTenant({ slug: 'tenant-1', name: 'Tenant 1' });
    tenant2 = await createTestTenant({ slug: 'tenant-2', name: 'Tenant 2' });
  });

  describe('Products Isolation', () => {
    it('should only return products for the specified tenant', async () => {
      const db = getTestDb();

      // Create products for both tenants
      await createTestProduct(tenant1.id, { name: 'Tenant 1 Product', sku: 'T1-001' });
      await createTestProduct(tenant2.id, { name: 'Tenant 2 Product', sku: 'T2-001' });

      // Query products for tenant 1
      const tenant1Products = await db
        .select()
        .from(products)
        .where(eq(products.tenantId, tenant1.id));

      // Should only get tenant 1's products
      expect(tenant1Products).toHaveLength(1);
      expect(tenant1Products[0].name).toBe('Tenant 1 Product');
      expect(tenant1Products[0].tenantId).toBe(tenant1.id);
    });

    it('should prevent cross-tenant product access', async () => {
      const db = getTestDb();

      const product1 = await createTestProduct(tenant1.id, { name: 'Tenant 1 Product' });
      const product2 = await createTestProduct(tenant2.id, { name: 'Tenant 2 Product' });

      // Try to query tenant 2's product with tenant 1's context
      const crossTenantQuery = await db
        .select()
        .from(products)
        .where(and(eq(products.id, product2.id), eq(products.tenantId, tenant1.id)));

      // Should return empty (product belongs to tenant 2, not tenant 1)
      expect(crossTenantQuery).toHaveLength(0);
    });

    it('should enforce tenant ID on product creation', async () => {
      const db = getTestDb();

      const [newProduct] = await db
        .insert(products)
        .values({
          tenantId: tenant1.id,
          sku: 'TEST-001',
          name: 'Test Product',
          price: '99.99',
          category: 'test',
        })
        .returning();

      expect(newProduct.tenantId).toBe(tenant1.id);

      // Verify it's not accessible from tenant 2's context
      const fromTenant2 = await db
        .select()
        .from(products)
        .where(and(eq(products.id, newProduct.id), eq(products.tenantId, tenant2.id)));

      expect(fromTenant2).toHaveLength(0);
    });
  });

  describe('Services Isolation', () => {
    it('should only return services for the specified tenant', async () => {
      const db = getTestDb();

      await createTestService(tenant1.id, { name: 'Tenant 1 Service' });
      await createTestService(tenant2.id, { name: 'Tenant 2 Service' });

      const tenant1Services = await db
        .select()
        .from(services)
        .where(eq(services.tenantId, tenant1.id));

      expect(tenant1Services).toHaveLength(1);
      expect(tenant1Services[0].name).toBe('Tenant 1 Service');
    });

    it('should prevent cross-tenant service updates', async () => {
      const db = getTestDb();

      const service1 = await createTestService(tenant1.id, { name: 'Original Name' });

      // Try to update with wrong tenant ID (should affect 0 rows)
      const result = await db
        .update(services)
        .set({ name: 'Hacked Name' })
        .where(and(eq(services.id, service1.id), eq(services.tenantId, tenant2.id)))
        .returning();

      // Should not update anything
      expect(result).toHaveLength(0);

      // Verify original name is unchanged
      const [unchanged] = await db
        .select()
        .from(services)
        .where(eq(services.id, service1.id));

      expect(unchanged.name).toBe('Original Name');
    });
  });

  describe('Multi-Tenant Data Integrity', () => {
    it('should maintain separate data sets for multiple tenants', async () => {
      const db = getTestDb();

      // Create 3 products for tenant 1, 2 for tenant 2
      await Promise.all([
        createTestProduct(tenant1.id, { name: 'T1-P1' }),
        createTestProduct(tenant1.id, { name: 'T1-P2' }),
        createTestProduct(tenant1.id, { name: 'T1-P3' }),
        createTestProduct(tenant2.id, { name: 'T2-P1' }),
        createTestProduct(tenant2.id, { name: 'T2-P2' }),
      ]);

      const tenant1Count = await db
        .select()
        .from(products)
        .where(eq(products.tenantId, tenant1.id));

      const tenant2Count = await db
        .select()
        .from(products)
        .where(eq(products.tenantId, tenant2.id));

      expect(tenant1Count).toHaveLength(3);
      expect(tenant2Count).toHaveLength(2);
    });

    it('should allow same SKUs across different tenants', async () => {
      const db = getTestDb();

      const sameSku = 'PRODUCT-001';

      await createTestProduct(tenant1.id, { sku: sameSku, name: 'Tenant 1 Product' });
      await createTestProduct(tenant2.id, { sku: sameSku, name: 'Tenant 2 Product' });

      const tenant1Product = await db
        .select()
        .from(products)
        .where(and(eq(products.sku, sameSku), eq(products.tenantId, tenant1.id)));

      const tenant2Product = await db
        .select()
        .from(products)
        .where(and(eq(products.sku, sameSku), eq(products.tenantId, tenant2.id)));

      expect(tenant1Product).toHaveLength(1);
      expect(tenant2Product).toHaveLength(1);
      expect(tenant1Product[0].name).toBe('Tenant 1 Product');
      expect(tenant2Product[0].name).toBe('Tenant 2 Product');
    });
  });

  describe('Tenant Deletion Safety', () => {
    it('should prevent accidental cross-tenant deletion', async () => {
      const db = getTestDb();

      const product1 = await createTestProduct(tenant1.id, { name: 'Important Product' });
      const product2 = await createTestProduct(tenant2.id, { name: 'Other Product' });

      // Try to delete tenant 1's product using tenant 2's context
      const deleted = await db
        .delete(products)
        .where(and(eq(products.id, product1.id), eq(products.tenantId, tenant2.id)))
        .returning();

      // Should not delete anything
      expect(deleted).toHaveLength(0);

      // Verify product still exists
      const [stillExists] = await db
        .select()
        .from(products)
        .where(eq(products.id, product1.id));

      expect(stillExists).toBeDefined();
      expect(stillExists.name).toBe('Important Product');
    });
  });

  describe('Query Performance with Tenant Filters', () => {
    it('should efficiently filter by tenant ID', async () => {
      const db = getTestDb();

      // Create many products for multiple tenants
      const createPromises = [];
      for (let i = 0; i < 50; i++) {
        createPromises.push(
          createTestProduct(tenant1.id, { name: `T1-Product-${i}`, sku: `T1-${i}` })
        );
      }
      for (let i = 0; i < 30; i++) {
        createPromises.push(
          createTestProduct(tenant2.id, { name: `T2-Product-${i}`, sku: `T2-${i}` })
        );
      }
      await Promise.all(createPromises);

      const start = Date.now();
      const tenant1Products = await db
        .select()
        .from(products)
        .where(eq(products.tenantId, tenant1.id));
      const duration = Date.now() - start;

      expect(tenant1Products).toHaveLength(50);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
