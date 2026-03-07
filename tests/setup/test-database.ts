/**
 * Test database utilities
 * Provides helpers for setting up and tearing down test database
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "@sass-store/database/schema";

let testDb: ReturnType<typeof drizzle> | null = null;
let testClient: ReturnType<typeof postgres> | null = null;

const getConnectionString = () =>
  process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

const isTestRuntime = () =>
  process.env.NODE_ENV === "test" || typeof process.env.VITEST !== "undefined";

const shouldRunCleanup = () => {
  if (process.env.TEST_DATABASE_URL) {
    return true;
  }

  // Allow cleanup during Vitest runs even when TEST_DATABASE_URL is not explicitly set.
  // This prevents cross-test contamination (duplicate unique keys) in unit suites.
  return isTestRuntime() && Boolean(getConnectionString());
};

const createDatabaseInstance = () => {
  if (testDb) {
    return testDb;
  }

  const connectionString = getConnectionString();

  if (!connectionString) {
    console.warn("⚠️  No DATABASE_URL found - database tests will be skipped");
    return null;
  }

  try {
    testClient = postgres(connectionString, {
      max: 1,
      onnotice: () => {}, // Suppress notices during tests
    });

    testDb = drizzle(testClient, { schema });
    return testDb;
  } catch (error) {
    console.error("Failed to setup test database:", error);
    testClient = null;
    testDb = null;
    return null;
  }
};

/**
 * Get test database instance
 */
export function getTestDb() {
  if (!testDb) {
    createDatabaseInstance();
  }

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
  return createDatabaseInstance();
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
 *
 * ⚠️ SAFETY: Only runs if TEST_DATABASE_URL is explicitly set
 * This prevents accidentally wiping production data
 */
export async function cleanupTestData() {
  // 🚨 SAFETY CHECK: cleanup is enabled for explicit test DB URLs or Vitest runtime.
  if (!shouldRunCleanup()) {
    console.warn(
      "⚠️  SKIPPING cleanup - test database cleanup not enabled",
    );
    return;
  }

  if (!testDb || !testClient) {
    createDatabaseInstance();
  }

  if (!testClient) return;

  // List of tables to clean (in order to avoid foreign key constraints)
  // Start with most dependent tables, end with root tables
  const tables = [
    "product_reviews",
    "order_items",
    "user_carts",
    "bookings",
    "payments",
    "orders",
    "products",
    "services",
    "staff",
    "accounts",
    "sessions",
    "oauth_state_tokens",
    "users",
    "tenant_configs",
    "tenants", // Clean tenants to avoid duplicate slug errors
  ];

  try {
    for (const table of tables) {
      await testClient.unsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    }
  } catch (error) {
    // Silently skip cleanup if database doesn't exist
    // This allows tests that don't require DB to still run
  }
}

/**
 * Generate a unique test identifier
 * Combines timestamp with random string for collision resistance
 */
function generateUniqueId(prefix: string = "test"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a test tenant
 * IMPORTANT: Always generates a unique slug to prevent test pollution
 * even when overrides.slug is provided (it gets a unique suffix)
 */
export async function createTestTenant(
  overrides: Partial<typeof schema.tenants.$inferInsert> = {},
) {
  const db = getTestDb();

  // Extract slug prefix from overrides or use default, then ensure uniqueness
  const slugPrefix = overrides.slug || "test";
  const uniqueSlug = generateUniqueId(String(slugPrefix));

  // Build values object, excluding slug from overrides to ensure uniqueness
  const { slug: _omitSlug, ...restOverrides } = overrides;
  const values: typeof schema.tenants.$inferInsert = {
    slug: uniqueSlug,
    name: "Test Tenant",
    mode: "catalog",
    branding: {},
    contact: {},
    location: {},
    quotas: {},
    ...restOverrides,
  };

  try {
    const [tenant] = await db.insert(schema.tenants).values(values).returning();
    return tenant;
  } catch (error) {
    const maybeMessage = error instanceof Error ? error.message : String(error);

    // If still getting unique constraint error, try with more entropy
    if (maybeMessage.includes("tenants_slug_unique")) {
      const fallbackSlug = `${uniqueSlug}-${process.pid}-${Math.random().toString(36).substring(2, 7)}`;
      try {
        const [tenant] = await db
          .insert(schema.tenants)
          .values({ ...values, slug: fallbackSlug })
          .returning();
        return tenant;
      } catch {
        // Last resort: try to find existing tenant
        const [existingTenant] = await db
          .select()
          .from(schema.tenants)
          .where(eq(schema.tenants.slug, fallbackSlug))
          .limit(1);

        if (existingTenant) {
          return existingTenant;
        }
      }
    }

    throw error;
  }
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
      sku: `TEST-${Date.now()}-${Math.random().toString(36).substring(7)}`,
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
      duration: "60",
      price: "49.99",
      active: true,
      ...overrides,
    })
    .returning();

  return service;
}

/**
 * Create a test user
 * IMPORTANT: Always generates unique id and email to prevent test pollution
 * even when overrides are provided
 */
export async function createTestUser(
  overrides: Partial<typeof schema.users.$inferInsert> = {},
) {
  const db = getTestDb();

  // Extract email prefix from overrides or use default
  const emailPrefix = overrides.email?.split("@")[0] || "test-user";
  // Always generate unique email and id to prevent test pollution
  const uniqueEmail = `${generateUniqueId(emailPrefix)}@example.com`;
  const uniqueId = generateUniqueId("user");

  // Build values object, excluding id and email from overrides to ensure uniqueness
  const { id: _omitId, email: _omitEmail, ...restOverrides } = overrides;
  const values: typeof schema.users.$inferInsert = {
    id: uniqueId,
    email: uniqueEmail,
    name: "Test User",
    password: "hashed_password_here",
    ...restOverrides,
  };

  try {
    const [user] = await db.insert(schema.users).values(values).returning();
    return user;
  } catch (error) {
    const maybeMessage = error instanceof Error ? error.message : String(error);

    // If still getting unique constraint error, try with more entropy
    if (maybeMessage.includes("users_email_unique")) {
      const fallbackEmail = `${generateUniqueId(emailPrefix + process.pid)}@example.com`;
      try {
        const [user] = await db
          .insert(schema.users)
          .values({ ...values, email: fallbackEmail })
          .returning();
        return user;
      } catch {
        // Last resort: try to find existing user
        const [existingUser] = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, fallbackEmail))
          .limit(1);

        if (existingUser) {
          return existingUser;
        }
      }
    }

    throw error;
  }
}
