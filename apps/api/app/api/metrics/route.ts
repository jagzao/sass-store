import { NextRequest, NextResponse } from "next/server";
import { getMetricsSummary } from "@/lib/monitoring";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const hours = parseInt(url.searchParams.get("hours") || "24");

    const metrics = await getMetricsSummary(hours);

    return NextResponse.json({
      period: `${hours} hours`,
      timestamp: new Date().toISOString(),
      ...metrics,
    });
  } catch (error) {
    console.error("Metrics error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch metrics",
      },
      { status: 500 }
    );
  }
}
