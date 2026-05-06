import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/health/route";
import { NextRequest } from "next/server";

// Mock database
vi.mock("@sass-store/database", () => ({
  db: {
    execute: vi.fn().mockResolvedValue([{ 1: 1 }]),
  },
}));

describe("Health Endpoint", () => {
  it("should return 200 with status ok when DB is healthy", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.version).toBeDefined();
    expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(data.checks.database.status).toBe("ok");
    expect(data.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("should return 503 when DB fails", async () => {
    // Override mock for this test
    const { db } = await import("@sass-store/database");
    (db.execute as any).mockRejectedValueOnce(new Error("DB timeout"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("degraded");
    expect(data.checks.database.status).toBe("error");
  });
});
