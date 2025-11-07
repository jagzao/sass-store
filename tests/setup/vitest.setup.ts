/**
 * Vitest global setup file
 * Runs before all test suites
 */

import { beforeAll, afterAll, afterEach } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
} from "./test-database";

// Setup test database before all tests (only if DATABASE_URL is available)
beforeAll(async () => {
  if (process.env.DATABASE_URL || process.env.TEST_DATABASE_URL) {
    console.log("🔧 Setting up test environment...");
    await setupTestDatabase();
    console.log("✅ Test environment ready");
  } else {
    console.log("⚠️  Skipping database setup (no DATABASE_URL found)");
  }
});

// Cleanup after each test
afterEach(async () => {
  if (process.env.DATABASE_URL || process.env.TEST_DATABASE_URL) {
    await cleanupTestData();
  }
});

// Teardown after all tests
afterAll(async () => {
  if (process.env.DATABASE_URL || process.env.TEST_DATABASE_URL) {
    console.log("🧹 Cleaning up test environment...");
    await teardownTestDatabase();
    console.log("✅ Test environment cleaned up");
  }
});

// Mock environment variables for testing
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
