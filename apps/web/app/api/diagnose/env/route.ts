import { NextRequest, NextResponse } from "next/server";
import { requireDiagnoseAuth } from "@/lib/api/diagnose-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // STRY-021 SEC-009: Proteger con guard de diagnóstico
  const authError = requireDiagnoseAuth(request);
  if (authError) return authError;

  const dbUrl = process.env.DATABASE_URL || "";

  // Solo exponer si está seteado, nunca el valor ni preview
  let details: Record<string, unknown> = {};
  try {
    if (dbUrl) {
      const url = new URL(dbUrl);
      details = {
        protocol: url.protocol,
        // STRY-021: Omitir host completo — usar solo categoría
        isLocalhost:
          url.hostname.includes("localhost") ||
          url.hostname.includes("127.0.0.1"),
        isSupabase: url.hostname.includes("supabase"),
        isPooler:
          url.hostname.includes("pooler") || url.hostname.includes("supavisor"),
        hasPort: !!url.port,
        hasDatabase: url.pathname.length > 1,
      };
    }
  } catch {
    details = { error: "Invalid URL format" };
  }

  return NextResponse.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    database: {
      // STRY-021 SEC-009: Booleano únicamente — sin preview del valor
      defined: !!dbUrl,
      details,
    },
    timestamp: new Date().toISOString(),
  });
}
