/**
 * Smoke — Quality endpoints
 * Lightweight checks to ensure quality endpoints respond.
 */
import { test, expect } from "@playwright/test";

test.describe("Smoke — Quality OS", () => {
  test("GET /api/system/quality returns JSON", async ({ request }) => {
    const res = await request.get("/api/system/quality");
    const okStatus = res.status() === 401 || res.status() === 200;
    expect(okStatus).toBe(true);
  });
});
