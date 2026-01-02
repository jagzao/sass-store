import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Redirect to the error page
  return NextResponse.redirect(
    new URL("/auth/error", process.env.NEXTAUTH_URL || "http://localhost:3001"),
  );
}

export async function POST() {
  // Redirect to the error page
  return NextResponse.redirect(
    new URL("/auth/error", process.env.NEXTAUTH_URL || "http://localhost:3001"),
  );
}
