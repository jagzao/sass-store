/**
 * STRY-021 SEC-009 — Protección para endpoints de diagnóstico.
 *
 * En producción: siempre 404.
 * En staging/preview: exige token si REQUIRE_DIAGNOSE_AUTH=true.
 * En desarrollo local: acceso libre.
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Guard para endpoints de diagnóstico.
 * Retorna NextResponse de error si no autorizado, null si está OK.
 *
 * Uso:
 *   const authError = requireDiagnoseAuth(request);
 *   if (authError) return authError;
 */
export function requireDiagnoseAuth(request: NextRequest): NextResponse | null {
  // Bloquear siempre en producción
  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // En staging/preview o cuando se fuerza la autenticación
  const requireAuth =
    process.env.VERCEL_ENV === "preview" ||
    process.env.REQUIRE_DIAGNOSE_AUTH === "true";

  if (requireAuth) {
    const token =
      request.headers.get("x-diagnose-token") ??
      request.nextUrl.searchParams.get("diagnose_token");
    const expected = process.env.DIAGNOSE_SECRET_TOKEN;

    if (!expected) {
      return NextResponse.json(
        { error: "Diagnose not configured — set DIAGNOSE_SECRET_TOKEN" },
        { status: 503 },
      );
    }

    if (!token || token !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return null; // Autorizado
}
