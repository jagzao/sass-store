import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    // Server-side variable
    apiUrl: process.env.API_URL,
    // Client-side variable
    nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL,
    // Environment
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    // What fetch-with-cache would use
    effectiveUrl:
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:4000",
  });
}
