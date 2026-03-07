import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
import * as path from "path";

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, ".env.test") });

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",

  // Performance: Run tests in parallel
  fullyParallel: true,

  // Retry on CI, but not locally for faster feedback
  retries: isCI ? 2 : 0,

  // Performance: Use 50% of available CPUs (better than 100% or just 1)
  workers: isCI ? 1 : "50%",

  // Timeout configuration (smart defaults)
  timeout: 60000, // 60s per test
  expect: {
    timeout: 10000, // 10s for assertions
  },

  // Reporter: list in dev (better UX), html in CI
  reporter: isCI
    ? [["html"], ["github"]]
    : [["list"], ["html", { open: "never" }]],

  use: {
    // Base URL from environment
    baseURL: process.env.BASE_URL || "http://localhost:3002",

    // Performance: Only capture trace on retry (not every test)
    trace: "on-first-retry",

    // UX: Only screenshots and videos on failure
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    // Performance: Reasonable timeout for actions
    actionTimeout: 10000, // 10s for clicks, fills, etc.
    navigationTimeout: 30000, // 30s for page loads
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Performance: Disable unnecessary features
        launchOptions: {
          args: [
            "--disable-dev-shm-usage", // Prevent shared memory issues
            "--no-sandbox", // For CI environments
          ],
        },
      },
    },

    // Optional: Uncomment for cross-browser testing
    // {
    //   name: "firefox",
    //   use: devices["Desktop Firefox"]
    // },
    // {
    //   name: "webkit",
    //   use: devices["Desktop Safari"]
    // },

    // Optional: Uncomment for mobile testing
    // {
    //   name: "Mobile Chrome",
    //   use: devices["Pixel 5"]
    // },
    // {
    //   name: "Mobile Safari",
    //   use: devices["iPhone 12"]
    // },
  ],

  webServer: {
    command: "npm run build --filter=@sass-store/web && cd apps/web && npm run start -- -p 3002",
    port: 3002,

    // Performance: Reuse existing server if possible
    reuseExistingServer: !process.env.CI,

    // Timeout: Give enough time for Next.js to build and start
    timeout: 300000, // 5 minutes build + start

    // Environment variables for test mode
    env: {
      NODE_ENV: "production",
      PORT: "3002",
      AUTH_SECRET: "super-secret-test-key-for-nextauth-e2e",
      NEXTAUTH_SECRET: "super-secret-test-key-for-nextauth-e2e",
      NEXTAUTH_URL: "http://localhost:3002",
      AUTH_URL: "http://localhost:3002",
      GOOGLE_CLIENT_ID: "mock_client_id_for_testing",
      GOOGLE_CLIENT_SECRET: "mock_client_secret_for_testing",
    },
  },
});
