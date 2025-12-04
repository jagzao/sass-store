import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "SaaS Store API is running",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      graphql: "/api/graphql",
      docs: "https://github.com/yourusername/sass-store",
    },
  });
}
