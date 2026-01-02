import { NextResponse } from "next/server";

export const runtime = "edge"; // Run on Edge to bypass Node.js limits/issues

export function GET() {
  return NextResponse.json({
    status: "ok",
    runtime: "edge",
    timestamp: new Date().toISOString(),
  });
}
