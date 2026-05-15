import { test, expect } from "@playwright/test";

test.describe("Health E2E", () => {
  test("health endpoint responds 200", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.checks.database.status).toBe("ok");
  });
});
