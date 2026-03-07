import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.{test,spec}.{ts,tsx,js,jsx,mjs}"],
    exclude: [
      "node_modules",
      "dist",
      ".next",
      "tests/e2e/**", // E2E tests run separately with Playwright
    ],
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      "@sass-store/database": resolve(__dirname, "./packages/database"),
      "@sass-store/config": resolve(__dirname, "./packages/config"),
      "@sass-store/core": resolve(__dirname, "./packages/core"),
      "@sass-store/validation": resolve(__dirname, "./packages/validation"),
    },
  },
  esbuild: {
    // Enable esbuild to handle TypeScript files
    target: "node18",
  },
});