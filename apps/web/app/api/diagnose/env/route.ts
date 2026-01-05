import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "";

  // Safety masking
  const maskedUrl = dbUrl.replace(/:[^:@]*@/, ":****@");

  // Parse URL to extract helpful details
  let details = {};
  try {
    if (dbUrl) {
      const url = new URL(dbUrl);
      details = {
        protocol: url.protocol,
        host: url.hostname,
        port: url.port,
        pathname: url.pathname,
        params: Object.fromEntries(url.searchParams),
        isLocalhost:
          url.hostname.includes("localhost") ||
          url.hostname.includes("127.0.0.1"),
        isSupabase: url.hostname.includes("supabase"),
        isPooler:
          url.hostname.includes("pooler") || url.hostname.includes("supavisor"),
      };
    }
  } catch (e) {
    details = { error: "Invalid URL format" };
  }

  return NextResponse.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    database: {
      defined: !!dbUrl,
      masked: maskedUrl,
      details,
    },
    timestamp: new Date().toISOString(),
  });
}
