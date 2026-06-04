import { NextResponse } from "next/server";

// STRY-022 SEC-NEW-001: Endpoint eliminado.
// Tenía credenciales hardcodeadas (marialiciavh1984@gmail.com / "admin"),
// no tenía auth ni NODE_ENV guard, y devolvía la contraseña en plaintext.
// Para seedear: usar `npm run db:seed` desde CLI local.
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
