import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/monitoring";

export async function GET() {
  try {
    const health = await checkHealth();

    const statusCode =
      health.status === "healthy"
        ? 200
        : health.status === "degraded"
          ? 200
          : 503;

    return NextResponse.json(
      {
        status: health.status,
        timestamp: new Date().toISOString(),
        checks: health.checks,
        metrics: health.metrics,
        uptime: process.uptime(),
      },
      { status: statusCode }
    );
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
      { status: 503 }
    );
  }
}
