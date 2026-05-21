import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import {
  bookings,
  customers,
  scheduledNotifications,
  tenants,
} from "@sass-store/database/schema";
import { and, eq, gte, isNotNull, lte, ne, sql } from "drizzle-orm";
import { z } from "zod";

const broadcastSchema = z.object({
  message: z.string().min(1).max(4000),
  scheduledAt: z.string().datetime().optional(), // ISO string; undefined = now
  recipients: z.discriminatedUnion("type", [
    z.object({ type: z.literal("all") }),
    z.object({
      type: z.literal("upcoming"),
      daysAhead: z.number().int().min(1).max(30).default(7),
    }),
    z.object({
      type: z.literal("inactive"),
      daysSince: z.number().int().min(1).max(365).default(60),
    }),
    z.object({
      type: z.literal("specific"),
      customerIds: z.array(z.string().uuid()).min(1).max(200),
    }),
  ]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: tenantSlug } = await params;
    const body = broadcastSchema.parse(await request.json());

    const [tenant] = await db
      .select({ id: tenants.id, name: tenants.name })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant)
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const scheduledAt = body.scheduledAt
      ? new Date(body.scheduledAt)
      : new Date();

    // ── Resolve recipients ────────────────────────────────────────────────
    let targets: { id: string; name: string; phone: string }[] = [];

    const baseWhere = [
      eq(customers.tenantId, tenant.id),
      isNotNull(customers.phone),
      ne(customers.phone, ""),
    ];

    if (body.recipients.type === "all") {
      const rows = await db
        .select({
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
        })
        .from(customers)
        .where(and(...baseWhere));
      targets = rows.filter((r) => r.phone) as typeof targets;
    }

    if (body.recipients.type === "upcoming") {
      const from = new Date();
      const to = new Date(Date.now() + body.recipients.daysAhead * 86400000);
      const rows = await db
        .selectDistinct({
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
        })
        .from(customers)
        .innerJoin(bookings, eq(bookings.customerId, customers.id))
        .where(
          and(
            ...baseWhere,
            eq(bookings.tenantId, tenant.id),
            gte(bookings.startTime, from),
            lte(bookings.startTime, to),
          ),
        );
      targets = rows.filter((r) => r.phone) as typeof targets;
    }

    if (body.recipients.type === "inactive") {
      const cutoff = new Date(
        Date.now() - body.recipients.daysSince * 86400000,
      );

      // Customers whose last booking was before cutoff (or never booked)
      const active = await db
        .selectDistinct({ customerId: bookings.customerId })
        .from(bookings)
        .where(
          and(
            eq(bookings.tenantId, tenant.id),
            gte(bookings.startTime, cutoff),
          ),
        );
      const activeIds = new Set(
        active.map((r) => r.customerId).filter(Boolean),
      );

      const rows = await db
        .select({
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
        })
        .from(customers)
        .where(and(...baseWhere));

      targets = rows.filter(
        (r) => r.phone && !activeIds.has(r.id),
      ) as typeof targets;
    }

    if (body.recipients.type === "specific") {
      const rows = await db
        .select({
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
        })
        .from(customers)
        .where(
          and(
            ...baseWhere,
            sql`${customers.id} = ANY(${body.recipients.customerIds})`,
          ),
        );
      targets = rows.filter((r) => r.phone) as typeof targets;
    }

    if (targets.length === 0)
      return NextResponse.json(
        { error: "No recipients with phone numbers found" },
        { status: 422 },
      );

    // ── Insert notifications ───────────────────────────────────────────────
    const ts = Date.now();
    const values = targets.map((t, i) => ({
      tenantId: tenant.id,
      channel: "whatsapp" as const,
      status: "pending" as const,
      scheduledAt,
      recipientPhone: t.phone!.replace(/\D/g, ""),
      recipientName: t.name ?? "Cliente",
      body: body.message,
      templateKey: "broadcast",
      customerId: t.id,
      idempotencyKey: `broadcast:${tenant.id}:${ts}:${i}`,
      createdBy: "admin_broadcast",
      payload: { tenantSlug, broadcast: true },
    }));

    const inserted = await db
      .insert(scheduledNotifications)
      .values(values)
      .returning({ id: scheduledNotifications.id });

    return NextResponse.json({
      data: {
        queued: inserted.length,
        scheduledAt: scheduledAt.toISOString(),
        recipientCount: targets.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: "Invalid body", details: error.errors },
        { status: 400 },
      );
    console.error("broadcast POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Preview: estimate how many recipients a filter would return
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: tenantSlug } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "all";

    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant)
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const baseWhere = [
      eq(customers.tenantId, tenant.id),
      isNotNull(customers.phone),
      ne(customers.phone, ""),
    ];

    let count = 0;

    if (type === "all") {
      const [r] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(customers)
        .where(and(...baseWhere));
      count = r?.count ?? 0;
    }

    if (type === "upcoming") {
      const days = parseInt(searchParams.get("daysAhead") ?? "7");

      const [r] = await db
        .select({ count: sql<number>`count(distinct ${customers.id})::int` })
        .from(customers)
        .innerJoin(bookings, eq(bookings.customerId, customers.id))
        .where(
          and(
            ...baseWhere,
            eq(bookings.tenantId, tenant.id),
            gte(bookings.startTime, new Date()),
            lte(bookings.startTime, new Date(Date.now() + days * 86400000)),
          ),
        );
      count = r?.count ?? 0;
    }

    if (type === "inactive") {
      const days = parseInt(searchParams.get("daysSince") ?? "60");

      const cutoff = new Date(Date.now() - days * 86400000);
      const active = await db
        .selectDistinct({ customerId: bookings.customerId })
        .from(bookings)
        .where(
          and(
            eq(bookings.tenantId, tenant.id),
            gte(bookings.startTime, cutoff),
          ),
        );
      const activeIds = new Set(active.map((r) => r.customerId));
      const [r] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(customers)
        .where(and(...baseWhere));
      count = Math.max(0, (r?.count ?? 0) - activeIds.size);
    }

    return NextResponse.json({ data: { estimatedCount: count } });
  } catch (error) {
    console.error("broadcast GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
