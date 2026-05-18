import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  getOperatingHours,
  setOperatingHours,
} from "@/lib/calendar/calendar-config-store";
import {
  defaultOperatingHours,
  type OperatingHoursConfig,
} from "@/lib/calendar/operating-hours";

const timeRangeSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

const configSchema = z.object({
  intervalMinutes: z.number().int().min(15).max(60),
  days: z.record(z.string(), z.array(timeRangeSchema)),
});

async function resolveTenant(slug: string) {
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);
  return tenant ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: tenantSlug } = await params;
    const tenant = await resolveTenant(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const config = await getOperatingHours(tenant.id);
    return NextResponse.json({ data: config });
  } catch (error) {
    console.error("Calendar settings GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: tenantSlug } = await params;
    const tenant = await resolveTenant(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = configSchema.parse(body) as OperatingHoursConfig;
    const saved = await setOperatingHours(tenant.id, parsed);
    return NextResponse.json({ data: saved });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Configuración inválida", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Calendar settings PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST() {
  return NextResponse.json({ data: defaultOperatingHours() });
}
