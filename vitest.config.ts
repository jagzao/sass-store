import { defineConfig } from "vitest/config";
import { resolve } from "path";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "node_modules",
      "dist",
      ".next",
      "tests/e2e/**", // E2E tests run separately with Playwright
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
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
    },
  },
});
