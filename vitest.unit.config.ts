import { defineConfig } from "vitest/config";
import { resolve } from "path";

/**
 * Vitest configuration for unit tests
 * Simplified config without database setup for pure unit tests
 */
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/unit/**/*.spec.ts"],
    exclude: [
      "node_modules",
      "dist",
      ".next",
      "tests/e2e/**",
      "tests/integration/**",
    ],
    testTimeout: 15000,
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
    target: "node18",
    jsx: "preserve",
  },
});
