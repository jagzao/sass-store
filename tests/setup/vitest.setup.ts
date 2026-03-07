/**
 * Vitest global setup file
 * Runs before all test suites
 */

import { cleanupTestData } from "./test-database";

type HookRegistrar = (hook: () => Promise<void> | void) => void;

const registerCleanupHooks = () => {
  const maybeBeforeEach = (globalThis as { beforeEach?: HookRegistrar }).beforeEach;
  const maybeAfterEach = (globalThis as { afterEach?: HookRegistrar }).afterEach;

  // Guard to avoid executing hook registration in non-runner contexts
  if (typeof maybeBeforeEach === "function") {
    maybeBeforeEach(async () => {
      if (process.env.TEST_DATABASE_URL) {
        await cleanupTestData();
      }
    });
  }

  if (typeof maybeAfterEach === "function") {
    maybeAfterEach(async () => {
      if (process.env.TEST_DATABASE_URL) {
        await cleanupTestData();
      }
    });
  }
};

registerCleanupHooks();
