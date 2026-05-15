import { defineConfig } from "vitest/config";
import { resolve } from "path";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Enable both global setup and setup files
    globalSetup: "./tests/setup/vitest.global-setup.ts",
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    // Only modern .spec.ts test files. Legacy .test.ts files must be migrated manually.
    include: ["tests/**/*.spec.ts"],
    exclude: [
      "node_modules",
      "dist",
      ".next",
      "tests/e2e/**", // E2E tests run separately with Playwright
      "tests/integration/wondernails-performance.int.spec.ts", // Playwright test
      "tests/integration/api/tenant-api.spec.ts", // Playwright test
      "**/*.test.ts", // Legacy tests pending migration
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["apps/web/lib/**/*.ts", "packages/**/src/**/*.ts"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.config.{js,ts}",
        "**/dist/",
        "**/.next/",
      ],
    },
    testTimeout: 15000,
    hookTimeout: 30000, // Increased for database cleanup
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./apps/web"),
      "@/lib": resolve(__dirname, "./apps/web/lib"),
      "@/components": resolve(__dirname, "./apps/web/components"),
      "@sass-store/database": resolve(__dirname, "./packages/database"),
      "@sass-store/config": resolve(__dirname, "./packages/config"),
      "@sass-store/core": resolve(__dirname, "./packages/core"),
      "@sass-store/validation": resolve(__dirname, "./packages/validation"),
    },
  },
  esbuild: {
    // Enable esbuild to handle TypeScript files
    target: "node18",
    jsx: "automatic",
  },
});
