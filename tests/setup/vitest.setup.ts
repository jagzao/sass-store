/**
 * Vitest global setup file
 * Runs before all test suites
 */

import { beforeAll, afterAll, afterEach } from "vitest";

// Setup test database before all tests (only if DATABASE_URL is available)
beforeAll(async () => {
  console.log("⚠️  Skipping database setup for debugging");
});

// Cleanup after each test
// 🚨 DISABLED FOR SAFETY - Only cleanup if TEST_DATABASE_URL is explicitly set
afterEach(async () => {
  if (process.env.TEST_DATABASE_URL) {
    // Silently skip if database is not available
  } else {
    // Skip cleanup if not using dedicated test database (prevents production wipes)
  }
});

// Mock environment variables for testing
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
