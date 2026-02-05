/**
 * Vitest global setup file
 * Runs before all test suites
 */

import { afterEach, beforeEach } from "vitest";
import { cleanupTestData } from "./test-database";

// Cleanup before and after each test to ensure isolation
// 🚨 SAFETY: Only cleanup if TEST_DATABASE_URL is explicitly set
beforeEach(async () => {
  if (process.env.TEST_DATABASE_URL) {
    await cleanupTestData();
  }
});

afterEach(async () => {
  if (process.env.TEST_DATABASE_URL) {
    await cleanupTestData();
  }
});
