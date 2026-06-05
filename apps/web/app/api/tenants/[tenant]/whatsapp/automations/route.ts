/**
 * GET  /api/tenants/[tenant]/whatsapp/automations
 * POST /api/tenants/[tenant]/whatsapp/automations
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { tenants, waAutomationRules } from "@sass-store/database/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  triggerEvent: z.enum([
    "booking_confirmed",
    "booking_cancelled",
    "customer_inactive_30d",
    "after_visit",
    "birthday",
  ]),
  actionType: z.enum(["send_text", "send_template", "escalate"]),
  actionConfig: z.object({
    message: z.string().optional(),
    templateId: z.string().optional(),
    delayMinutes: z.number().int().min(0).max(10080).optional(), // max 7 days
  }),
  enabled: z.boolean().default(true),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant: slug } = await params;
  const rows = await db
    .select()
    .from(waAutomationRules)
    .where(eq(waAutomationRules.tenantSlug, slug))
    .orderBy(desc(waAutomationRules.createdAt));
  return NextResponse.json({ data: rows });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: slug } = await params;
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);
    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant no encontrado" },
        { status: 404 },
      );
    }

    const parsed = createSchema.parse(await request.json());

    const [rule] = await db
      .insert(waAutomationRules)
      .values({
        tenantSlug: slug,
        name: parsed.name,
        triggerEvent: parsed.triggerEvent,
        actionType: parsed.actionType,
        actionConfig: parsed.actionConfig,
        enabled: parsed.enabled,
      })
      .returning();

    return NextResponse.json({ data: rule }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: err.errors },
        { status: 400 },
      );
    }
    console.error("[WA Automations POST]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
