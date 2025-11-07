/**
 * Test database utilities
 * Provides helpers for setting up and tearing down test database
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@sass-store/database/schema";

let testDb: ReturnType<typeof drizzle> | null = null;
let testClient: ReturnType<typeof postgres> | null = null;

/**
 * Get test database instance
 */
export function getTestDb() {
  if (!testDb) {
    throw new Error(
      "Test database not initialized. Call setupTestDatabase() first.",
    );
  }
  return testDb;
}

/**
 * Setup test database connection
 */
export async function setupTestDatabase() {
  const connectionString =
    process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn("⚠️  No DATABASE_URL found - database tests will be skipped");
    return null;
  }

  try {
    // Create postgres client
    testClient = postgres(connectionString, {
      max: 1,
      onnotice: () => {}, // Suppress notices during tests
    });

    // Create drizzle instance
    testDb = drizzle(testClient, { schema });

    // Run migrations if needed
    // await migrate(testDb, { migrationsFolder: './drizzle' });

    return testDb;
  } catch (error) {
    console.error("Failed to setup test database:", error);
    return null;
  }
}

/**
 * Teardown test database connection
 */
export async function teardownTestDatabase() {
  if (testClient) {
    await testClient.end();
    testClient = null;
    testDb = null;
  }
}

/**
 * Clean up test data after each test
 * Truncates all tables while preserving schema
 */
export async function cleanupTestData() {
  if (!testDb) return;

  // List of tables to clean (in order to avoid foreign key constraints)
  const tables = [
    "product_reviews",
    "bookings",
    "user_carts",
    "orders",
    "products",
    "services",
    "oauth_state_tokens",
    "users",
    // Note: Don't clean tenants table as it might have seed data
  ];

  try {
    for (const table of tables) {
      await testClient?.unsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    }
  } catch (error) {
    console.error("Error cleaning up test data:", error);
  }
}

/**
 * Create a test tenant
 */
export async function createTestTenant(
  overrides: Partial<typeof schema.tenants.$inferInsert> = {},
) {
  const db = getTestDb();

  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug: `test-${Date.now()}`,
      name: "Test Tenant",
      mode: "catalog",
      branding: {},
      contact: {},
      location: {},
      quotas: {},
      ...overrides,
    })
    .returning();

  return tenant;
}

/**
 * Create a test product
 */
export async function createTestProduct(
  tenantId: string,
  overrides: Partial<typeof schema.products.$inferInsert> = {},
) {
  const db = getTestDb();

  const [product] = await db
    .insert(schema.products)
    .values({
      tenantId,
      sku: `TEST-${Date.now()}`,
      name: "Test Product",
      price: "99.99",
      category: "test",
      active: true,
      featured: false,
      ...overrides,
    })
    .returning();

  return product;
}

/**
 * Create a test service
 */
export async function createTestService(
  tenantId: string,
  overrides: Partial<typeof schema.services.$inferInsert> = {},
) {
  const db = getTestDb();

  const [service] = await db
    .insert(schema.services)
    .values({
      tenantId,
      name: "Test Service",
      description: "Test service description",
      duration: 60,
      price: "49.99",
      active: true,
      ...overrides,
    })
    .returning();

  return service;
}

/**
 * Create a test user
 */
export async function createTestUser(
  overrides: Partial<typeof schema.users.$inferInsert> = {},
) {
  const db = getTestDb();

  const [user] = await db
    .insert(schema.users)
    .values({
      email: `test-${Date.now()}@example.com`,
      name: "Test User",
      password: "hashed_password_here",
      ...overrides,
    })
    .returning();

  return user;
}
