import { NextResponse } from "next/server";

// STRY-021 SEC-002: Endpoint eliminado — credenciales hardcodeadas + stack traces públicos.
// Tenía email "marialiciavh1984@gmail.com" y password "admin" en código fuente.
// Ver: .agents/sprint/STRY-021-security-perf-hardening/implementacion.md
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
