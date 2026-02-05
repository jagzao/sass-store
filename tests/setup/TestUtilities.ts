/**
 * Test Utilities
 *
 * Common utilities and helpers for testing across all test files.
 * Includes assertion helpers, mock factories, and test patterns.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { MockDatabase } from "../mocks/MockDatabase";
import {
  createTestContext,
  cleanupTestContext,
  createSeededTestContext,
} from "./TestContext";

// Test configuration
export const TEST_CONFIG = {
  timeout: 5000, // 5 seconds
  retry: 3,
  debug: process.env.TEST_DEBUG === "true",
};

// Global test database instance
let testDatabase: MockDatabase;

// Initialize test database before all tests
export const setupTestDatabase = (): void => {
  if (TEST_CONFIG.debug) {
    console.log("🔧 Setting up test database...");
  }

  testDatabase = new MockDatabase();
};

// Cleanup test database after all tests
export const teardownTestDatabase = (): void => {
  if (testDatabase) {
    testDatabase.clear();
  }

  if (TEST_CONFIG.debug) {
    console.log("🧹 Cleaned up test database");
  }
};

// Get global test database
export const getTestDatabase = (): MockDatabase => {
  if (!testDatabase) {
    throw new Error(
      "Test database not initialized. Call setupTestDatabase() first.",
    );
  }
  return testDatabase;
};

// Cleanup between tests
export const cleanupTestData = (): void => {
  if (testDatabase) {
    testDatabase.clear();
  }
};

// Result Pattern testing utilities
export const expectSuccess = <T>(result: any, message?: string): T => {
  if (!result?.success) {
    const errorMsg =
      message ||
      `Expected success but got error: ${result?.error?.message || result?.error}`;
    throw new Error(errorMsg);
  }
  return result.data;
};

export const expectFailure = <E>(result: any, message?: string): E => {
  if (result?.success) {
    const errorMsg =
      message || `Expected error but got success: ${result?.data}`;
    throw new Error(errorMsg);
  }
  return result.error;
};

export const expectValidationError = (result: any, expectedField?: string) => {
  const error = expectFailure(result, "Expected validation error");
  expect(error.type).toBe("ValidationError");
  if (expectedField) {
    expect(error.field).toBe(expectedField);
  }
  return error;
};

export const expectNotFoundError = (result: any, expectedResource?: string) => {
  const error = expectFailure(result, "Expected not found error");
  expect(error.type).toBe("NotFoundError");
  if (expectedResource) {
    expect(error.resource).toBe(expectedResource);
  }
  return error;
};

// Async test helpers
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = TEST_CONFIG.timeout,
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Test timeout after ${timeoutMs}ms`)),
        timeoutMs,
      );
    }),
  ]);
};

// Mock response helpers
export const createMockResponse = <T>(data: T, status: number = 200) => ({
  status,
  data,
  success: true,
  headers: new Headers({ "content-type": "application/json" }),
});

export const createMockErrorResponse = <E>(error: E, status: number = 400) => ({
  status,
  data: { success: false, error },
  success: false,
  headers: new Headers({ "content-type": "application/json" }),
});

// Test data generators
export const generateTestProducts = (count: number, tenantId: string) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `product-${index}-${Date.now()}`,
    tenantId,
    sku: `PROD-${index}-${Date.now()}`,
    name: `Test Product ${index}`,
    description: `Test product description ${index}`,
    price: `${Math.floor(Math.random() * 100) + 10}.${Math.floor(Math.random() * 99)}`,
    currency: "USD",
    stock: Math.floor(Math.random() * 100) + 1,
    status: "active" as const,
    tags: ["test", `category-${index % 3}`],
    imageUrl: `https://example.com/product-${index}.jpg`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
};

export const generateTestUsers = (count: number, tenantId: string) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `user-${index}-${Date.now()}`,
    email: `user-${index}@test.com`,
    name: `Test User ${index}`,
    tenantId,
    role: index === 0 ? "admin" : index === 1 ? "staff" : "customer",
    status: "active" as const,
    avatar: `https://example.com/avatar-${index}.jpg`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
};

// Performance testing helpers
export const measureAsyncOperation = async <T>(
  operation: () => Promise<T>,
  maxDurationMs: number = 1000,
): Promise<{ result: T; duration: number; withinThreshold: boolean }> => {
  const start = performance.now();
  const result = await operation();
  const duration = performance.now() - start;

  return {
    result,
    duration,
    withinThreshold: duration <= maxDurationMs,
  };
};

// Test patterns for common scenarios
export const testServiceErrorHandling = async (
  serviceCall: () => Promise<any>,
  expectedErrorType: string,
  testContext: string,
) => {
  const result = await serviceCall();

  expectFailure(result, `${testContext} should fail`);
  expect(result.error.type).toBe(expectedErrorType);
};

export const testServiceSuccess = async <T>(
  serviceCall: () => Promise<any>,
  expectedData?: Partial<T>,
  testContext: string,
) => {
  const result = await serviceCall();

  expectSuccess(result, `${testContext} should succeed`);

  if (expectedData) {
    expect(result.data).toEqual(expect.objectContaining(expectedData));
  }

  return result.data;
};

// Database testing utilities
export const assertDatabaseState = (
  db: MockDatabase,
  expectedCounts: Record<string, number>,
) => {
  const summary = db.getSummary();

  for (const [table, expectedCount] of Object.entries(expectedCounts)) {
    expect(summary[table as keyof typeof summary]).toBe(expectedCount);
  }
};

export const verifyTenantIsolation = async (
  db: MockDatabase,
  tenant1Id: string,
  tenant2Id: string,
  operation: () => Promise<void>,
) => {
  // Get counts before operation
  const beforeCounts = db.getSummary();

  await operation();

  // Verify data isolation
  const tenant1Products = await db.products.findMany(
    (p) => p.tenantId === tenant1Id,
  );
  const tenant2Products = await db.products.findMany(
    (p) => p.tenantId === tenant2Id,
  );

  // Products should not be shared between tenants
  const sharedProducts = tenant1Products.filter((p) =>
    tenant2Products.some((t2) => t2.id === p.id),
  );

  expect(sharedProducts).toHaveLength(0);
};

// Re-export vitest utilities for convenience
export { describe, it, expect, beforeEach, afterEach, vi };

// Test setup patterns
export const standardTestSetup = {
  beforeEach: () => {
    cleanupTestData();
  },
  afterEach: () => {
    cleanupTestData();
  },
};

// Common test scenarios
export const testScenarios = {
  createNewEntity: (entityName: string) => ({
    describe: `Create ${entityName}`,
    tests: [
      {
        name: `should create valid ${entityName}`,
        pattern: "valid-input-success",
      },
      {
        name: `should reject invalid ${entityName}`,
        pattern: "invalid-input-validation-error",
      },
      {
        name: `should handle missing required fields`,
        pattern: "missing-fields-validation-error",
      },
    ],
  }),

  updateEntity: (entityName: string) => ({
    describe: `Update ${entityName}`,
    tests: [
      {
        name: `should update ${entityName} with valid data`,
        pattern: "valid-update-success",
      },
      {
        name: `should reject update with invalid data`,
        pattern: "invalid-update-validation-error",
      },
      {
        name: `should return not found for non-existent ${entityName}`,
        pattern: "not-found-error",
      },
    ],
  }),

  deleteEntity: (entityName: string) => ({
    describe: `Delete ${entityName}`,
    tests: [
      {
        name: `should delete existing ${entityName}`,
        pattern: "existing-delete-success",
      },
      {
        name: `should return not found for non-existent ${entityName}`,
        pattern: "not-found-error",
      },
    ],
  }),
};
