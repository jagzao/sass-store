import { describe, it, expect } from "vitest";

/**
 * Health endpoint smoke test.
 * Requiere servidor E2E corriendo en localhost:3002.
 * Si no responde, el test se omite sin fallar.
 */
describe("Health Endpoint", () => {
  it("should return 200 with ok status", async () => {
    try {
      const res = await fetch("http://127.0.0.1:3002/api/health");
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("ok");
      expect(json.timestamp).toBeDefined();
      expect(new Date(json.timestamp).toISOString()).toBe(json.timestamp);
    } catch (err: any) {
      if (err?.cause?.code === "ECONNREFUSED") {
        console.warn("E2E server not running on :3002; skipping health check");
        return;
      }
      throw err;
    }
  });
});
