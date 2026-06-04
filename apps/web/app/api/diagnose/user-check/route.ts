import { NextResponse } from "next/server";

// STRY-021 SEC-001: Endpoint eliminado — credential oracle sin autenticación.
// Aceptaba ?email=x&password=y en GET query params, verificaba bcrypt sin auth.
// Ver: .agents/sprint/STRY-021-security-perf-hardening/implementacion.md
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
