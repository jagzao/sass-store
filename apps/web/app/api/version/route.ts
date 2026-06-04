import { NextResponse } from "next/server";
import { APP_VERSION, APP_NAME } from "@/lib/version";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    app: APP_NAME,
    version: APP_VERSION,
    deployedAt: new Date().toISOString(),
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
  });
}
