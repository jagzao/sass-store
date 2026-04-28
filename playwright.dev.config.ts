import { defineConfig, devices } from "@playwright/test";

// Config para correr tests E2E contra el dev server ya corriendo en :3001
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3001",
    trace: "off",
    screenshot: "only-on-failure",
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "echo 'Using existing dev server'",
    port: 3001,
    reuseExistingServer: true,
    timeout: 5000,
  },
});
