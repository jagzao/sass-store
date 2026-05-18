import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import { authorizeInternalRequest } from "@/lib/notifications/internal-api-auth";
import { listDueScheduledNotifications } from "@/lib/notifications/scheduled-notification-queue";

/**
 * GET /api/internal/scheduled-notifications
 *
 * Lista notificaciones pendientes listas para enviar (consumo n8n).
 * Auth: Authorization: Bearer {SCHEDULED_NOTIFICATIONS_API_KEY}
 */
export async function GET(request: NextRequest) {
  const denied = authorizeInternalRequest(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit") ?? "50")),
  );

  const tenantSlug = searchParams.get("tenantSlug")?.trim();
  let tenantId: string | undefined;
  if (tenantSlug) {
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);
    if (!tenant) {
      return NextResponse.json(
        { error: `Tenant not found: ${tenantSlug}` },
        { status: 404 },
      );
    }
    tenantId = tenant.id;
  }

  const rows = await listDueScheduledNotifications(limit, tenantId);

  return NextResponse.json({
    data: rows,
    meta: {
      count: rows.length,
      polledAt: new Date().toISOString(),
      tenantSlug: tenantSlug ?? null,
    },
  });
}
