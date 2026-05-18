import { NextRequest, NextResponse } from "next/server";

const HEADER = "authorization";

/**
 * Protege endpoints internos (n8n, cron) con Bearer token.
 * Variable: SCHEDULED_NOTIFICATIONS_API_KEY
 */
export function authorizeInternalRequest(
  request: NextRequest,
): NextResponse | null {
  const expected = process.env.SCHEDULED_NOTIFICATIONS_API_KEY;
  if (!expected) {
    console.error(
      "[scheduled-notifications] SCHEDULED_NOTIFICATIONS_API_KEY no configurada",
    );
    return NextResponse.json(
      { error: "Internal API not configured" },
      { status: 503 },
    );
  }

  const auth = request.headers.get(HEADER);
  const token = auth?.startsWith("Bearer ")
    ? auth.slice(7).trim()
    : request.headers.get("x-api-key");

  if (!token || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
