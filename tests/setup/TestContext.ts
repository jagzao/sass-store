/**
 * Test Context
 *
 * Provides a unified testing context with mock database,
 * test data builders, and common utilities.
 * Ensures proper test isolation between test runs.
 */

import { MockDatabase } from "../mocks/MockDatabase";
import { TenantBuilder } from "../builders/TenantBuilder";

export interface TestContext {
  db: MockDatabase;
  user: any;
  tenant: any;
}

export const createTestContext = (): TestContext => {
  const db = new MockDatabase();

  // Create tenant with unique identifier for test isolation
  const tenant = TenantBuilder.aTenant()
    .withSlug(`test-${Date.now()}-${Math.random().toString(36).substring(7)}`)
    .build();

  // Create user with proper tenant association
  const user = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
    name: "Test User",
    tenantId: tenant.id,
    role: "customer",
    status: "active",
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { db, user, tenant };
};

// Test-specific context creators
export const createCatalogTestContext = (): TestContext => {
  const db = new MockDatabase();

  const tenant = TenantBuilder.catalogTenant()
    .withSlug(
      `catalog-test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    )
    .build();

  const user = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    email: `catalog-user-${Date.now()}@example.com`,
    name: "Catalog Test User",
    tenantId: tenant.id,
    role: "admin" as const,
    status: "active" as const,
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { db, user, tenant };
};

export const createBookingTestContext = (): TestContext => {
  const db = new MockDatabase();

  const tenant = TenantBuilder.bookingTenant()
    .withSlug(
      `booking-test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    )
    .build();

  const user = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    email: `booking-user-${Date.now()}@example.com`,
    name: "Booking Test User",
    tenantId: tenant.id,
    role: "staff" as const,
    status: "active" as const,
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { db, user, tenant };
};

// Context with pre-seeded test data
export const createSeededTestContext = async (): Promise<TestContext> => {
  const context = createTestContext();

  // Seed the mock database with realistic data
  await context.db.seedTestData();

  // Update context with seeded data
  const tenant = await context.db.tenants.findById("test-tenant-1");
  const user = await context.db.users.findById("user-1");

  return {
    db: context.db,
    user: user || context.user,
    tenant: tenant || context.tenant,
  };
};

// Cleanup utilities
export const cleanupTestContext = async (
  context: TestContext,
): Promise<void> => {
  context.db.clear();
};

// Test assertions utilities
export const assertContextValid = (context: TestContext): void => {
  if (!context.db) {
    throw new Error("Test context missing database");
  }

  if (!context.user) {
    throw new Error("Test context missing user");
  }

  if (!context.tenant) {
    throw new Error("Test context missing tenant");
  }

  if (context.user.tenantId !== context.tenant.id) {
    throw new Error("User tenant ID mismatch in test context");
  }
};

// Generate test data with relationships
export const createTestProduct = (tenantId: string) => ({
  id: `product-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  tenantId,
  sku: `PROD-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  name: `Test Product ${Date.now()}`,
  description: "A test product for testing purposes",
  price: `${Math.floor(Math.random() * 100) + 10}.${Math.floor(Math.random() * 99)}`,
  currency: "USD",
  stock: Math.floor(Math.random() * 100) + 1,
  status: "active" as const,
  tags: ["test", "sample"],
  imageUrl: `https://example.com/product-${Math.random().toString(36).substring(7)}.jpg`,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const createTestService = (tenantId: string) => ({
  id: `service-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  tenantId,
  name: `Test Service ${Date.now()}`,
  description: "A test service for testing purposes",
  price: `${Math.floor(Math.random() * 200) + 50}.${Math.floor(Math.random() * 99)}`,
  currency: "USD",
  duration: 60 + Math.floor(Math.random() * 120),
  status: "active" as const,
  category: "consulting",
  imageUrl: `https://example.com/service-${Math.random().toString(36).substring(7)}.jpg`,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const createTestOrder = (tenantId: string, userId: string) => ({
  id: `order-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  tenantId,
  userId,
  status: "pending" as const,
  subtotal: "0.00",
  total: "0.00",
  currency: "USD",
  items: [],
  shippingAddress: {
    street: "123 Test St",
    city: "Test City",
    state: "TS",
    country: "US",
    zipCode: "12345",
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});
