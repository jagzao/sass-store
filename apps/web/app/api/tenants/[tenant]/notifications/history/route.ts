import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { scheduledNotifications, tenants } from "@sass-store/database/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: tenantSlug } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0");

    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant)
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const baseWhere = [eq(scheduledNotifications.tenantId, tenant.id)];
    if (status)
      baseWhere.push(eq(scheduledNotifications.status, status as never));

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

    const [rows, statsRows] = await Promise.all([
      db
        .select({
          id: scheduledNotifications.id,
          channel: scheduledNotifications.channel,
          status: scheduledNotifications.status,
          recipientPhone: scheduledNotifications.recipientPhone,
          recipientEmail: scheduledNotifications.recipientEmail,
          recipientName: scheduledNotifications.recipientName,
          templateKey: scheduledNotifications.templateKey,
          scheduledAt: scheduledNotifications.scheduledAt,
          sentAt: scheduledNotifications.sentAt,
          attempts: scheduledNotifications.attempts,
          lastError: scheduledNotifications.lastError,
          createdAt: scheduledNotifications.createdAt,
        })
        .from(scheduledNotifications)
        .where(and(...baseWhere))
        .orderBy(desc(scheduledNotifications.createdAt))
        .limit(limit)
        .offset(offset),

      db
        .select({
          status: scheduledNotifications.status,
          count: sql<number>`count(*)::int`,
        })
        .from(scheduledNotifications)
        .where(
          and(
            eq(scheduledNotifications.tenantId, tenant.id),
            gte(scheduledNotifications.createdAt, weekStart),
          ),
        )
        .groupBy(scheduledNotifications.status),
    ]);

    const stats = {
      sent: 0,
      failed: 0,
      pending: 0,
      processing: 0,
      cancelled: 0,
    };
    for (const r of statsRows) {
      stats[r.status as keyof typeof stats] = r.count;
    }

    const todayRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(scheduledNotifications)
      .where(
        and(
          eq(scheduledNotifications.tenantId, tenant.id),
          eq(scheduledNotifications.status, "sent"),
          gte(scheduledNotifications.sentAt!, todayStart),
        ),
      );

    return NextResponse.json({
      data: rows,
      stats: { ...stats, sentToday: todayRows[0]?.count ?? 0 },
      meta: { limit, offset, hasMore: rows.length === limit },
    });
  } catch (error) {
    console.error("notifications history GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
