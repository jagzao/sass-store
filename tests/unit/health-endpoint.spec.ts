import { describe, it, expect, vi } from "vitest";
import { GET } from "../../../apps/web/app/api/health/route";

// Mock database
vi.mock("@sass-store/database", () => ({
  db: {
    execute: vi.fn().mockResolvedValue([{ 1: 1 }]),
  },
}));

describe("Health Endpoint", () => {
  it("should return 200 with ok status when DB is healthy", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.version).toBeDefined();
    expect(body.timestamp).toBeDefined();
    expect(body.checks.database.status).toBe("ok");
    expect(body.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("should return 503 when DB is down", async () => {
    // Re-mock with failing DB
    const { db } = await import("@sass-store/database");
    (db.execute as any).mockRejectedValueOnce(new Error("DB down"));

    const response = await GET();
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body.status).toBe("degraded");
    expect(body.checks.database.status).toBe("error");
  });
});
