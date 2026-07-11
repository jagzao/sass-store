import { NextRequest, NextResponse } from "next/server";
import { CSRF_COOKIE_NAME } from "@sass-store/core";

export function GET(request: NextRequest) {
  const token = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "No CSRF token" }, { status: 404 });
  }
  return NextResponse.json({ token });
}
