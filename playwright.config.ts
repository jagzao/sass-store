import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
import * as path from "path";

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, ".env.test") });

const isCI = !!process.env.CI;
const workerCount = process.env.PW_WORKERS
  ? Number.parseInt(process.env.PW_WORKERS, 10)
  : 1;

/**
 * Usar servidor ya levantado (p. ej. `npm run dev` en 3001): no arranca el webServer en 3002.
 * Ejemplo: `BASE_URL=http://localhost:3001 E2E_REUSE_SERVER=1 npx playwright test tests/e2e/auth/`
 */
const useExternalDevServer =
  process.env.E2E_REUSE_SERVER === "1" &&
  Boolean(process.env.BASE_URL?.trim()) &&
  !isCI;

const webServer = useExternalDevServer
  ? undefined
  : {
      command: "node scripts/start-e2e-server.js",
      port: 3002,

      // Always start a fresh server locally so stale builds / wrong NODE_ENV
      // on port 3002 cannot poison E2E. Opt-in reuse with E2E_REUSE_SERVER=1.
      reuseExistingServer: process.env.E2E_REUSE_SERVER === "1",

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
        E2E_SEED_ENABLED: "true",
      },
    };

export default defineConfig({
  testDir: "./tests/e2e",

  // CI/ENTORNO DEV SERVIDOR LENTO: secuencial para evitar contención
  fullyParallel: false,

  // Retry on CI, but not locally for faster feedback
  retries: isCI ? 2 : 0,

  // Performance: Use 50% of available CPUs (better than 100% or just 1)
  // Default to serial-ish execution locally to avoid starving the Next.js server
  // during heavy crawls + UI smoke in parallel (fixes flaky timeouts on /login).
  workers: Number.isFinite(workerCount) && workerCount > 0 ? workerCount : 1,

  // Timeout configuration (Next `next start` E2E puede tardar en cold build)
  timeout: 120_000, // 120s per test
  expect: {
    timeout: 15_000, // assertions que esperan UI post-compilación
  },

  // Reporter: list in dev (better UX), html in CI
  reporter: isCI
    ? [["html"], ["github"]]
    : [["list"], ["html", { open: "never" }]],

  use: {
    // Base URL from environment
    baseURL: process.env.BASE_URL || "http://127.0.0.1:3002",

    // Trace: siempre en CI / modo debug; en local solo en primer retry
    trace: process.env.CI ? "on" : "on-first-retry",

    // UX: Only screenshots and videos on failure
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    // Performance: Reasonable timeout for actions
    actionTimeout: 15_000,
    navigationTimeout: 90_000, // alinear con tests/e2e/utils/wait-for-login.ts (cold start)
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

  ...(webServer ? { webServer } : {}),
});
