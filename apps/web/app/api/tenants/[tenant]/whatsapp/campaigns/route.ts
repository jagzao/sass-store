/**
 * POST /api/tenants/[tenant]/whatsapp/campaigns
 * GET  /api/tenants/[tenant]/whatsapp/campaigns
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { tenants, waCampaigns } from "@sass-store/database/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  audienceType: z.enum(["all", "segment", "manual"]).default("all"),
  audienceFilter: z.record(z.unknown()).optional(),
  message: z.string().min(1),
  scheduledAt: z.string().datetime({ offset: true }).optional().nullable(),
  messageTemplateId: z.string().optional(),
  templateVars: z.record(z.string()).optional(),
});

async function resolveTenantSlug(slug: string) {
  const [t] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);
  return t ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant: slug } = await params;
  const rows = await db
    .select()
    .from(waCampaigns)
    .where(eq(waCampaigns.tenantSlug, slug))
    .orderBy(desc(waCampaigns.createdAt))
    .limit(50);
  return NextResponse.json({ data: rows });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: slug } = await params;
    if (!(await resolveTenantSlug(slug))) {
      return NextResponse.json(
        { error: "Tenant no encontrado" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = createSchema.parse(body);

    const [campaign] = await db
      .insert(waCampaigns)
      .values({
        tenantSlug: slug,
        name: parsed.name,
        audienceType: parsed.audienceType,
        audienceFilter: parsed.audienceFilter ?? {},
        templateVars: {
          message: parsed.message,
          ...(parsed.templateVars ?? {}),
        },
        messageTemplateId: parsed.messageTemplateId ?? null,
        scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : null,
        status: parsed.scheduledAt ? "scheduled" : "draft",
      })
      .returning();

    return NextResponse.json({ data: campaign }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: err.errors },
        { status: 400 },
      );
    }
    console.error("[WA Campaigns API]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
