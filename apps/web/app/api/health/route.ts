import { NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * Health check endpoint para E2E, CI/CD y monitoreo.
 * Retorna 200 con estado OK si el servidor responde y la DB responde <500ms.
 */
export async function GET() {
  const start = Date.now();
  let dbStatus: "ok" | "error" = "ok";
  let dbLatency = 0;

  try {
    await db.execute(sql`SELECT 1`);
    dbLatency = Date.now() - start;
  } catch {
    dbStatus = "error";
  }

  const status = dbStatus === "ok" ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      version: process.env.npm_package_version ?? "0.0.0",
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: dbStatus, latencyMs: dbLatency },
      },
    },
    { status: status === "ok" ? 200 : 503 },
  );
}
