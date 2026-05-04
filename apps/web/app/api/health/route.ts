import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * Health check endpoint para E2E, CI/CD y monitoreo.
 * Retorna 200 con estado OK si el servidor responde.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      env: process.env.NODE_ENV,
    },
    { status: 200 },
  );
}
