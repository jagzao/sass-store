import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  getTenantReminderTemplates,
  saveTenantReminderTemplate,
  type ReminderTemplateKey,
} from "@/lib/notifications/notification-template";

const putSchema = z.object({
  reminder24h: z.string().min(1).max(2000).optional(),
  reminder1h: z.string().min(1).max(2000).optional(),
});

const PLACEHOLDERS = [
  "{{customerName}}",
  "{{tenantName}}",
  "{{serviceName}}",
  "{{appointmentDateTime}}",
];

/**
 * GET /api/tenants/[tenant]/notifications/templates
 * Plantillas de recordatorio WhatsApp (tenant_configs → notifications).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: tenantSlug } = await params;
    const [tenant] = await db
      .select({ id: tenants.id, name: tenants.name })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const templates = await getTenantReminderTemplates(tenant.id);
    return NextResponse.json({
      data: {
        reminder24h: templates.reminder24h,
        reminder1h: templates.reminder1h,
        placeholders: PLACEHOLDERS,
        hint: "Al crear una cita, la app encola mensajes en scheduled_notifications con scheduled_at = cita − 24h / − 1h. n8n los envía cuando toca.",
      },
    });
  } catch (error) {
    console.error("notification templates GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/tenants/[tenant]/notifications/templates
 * Guarda mensajes personalizados del tenant.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: tenantSlug } = await params;
    const body = putSchema.parse(await request.json());

    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    if (body.reminder24h !== undefined) {
      await saveTenantReminderTemplate(
        tenant.id,
        "reminder_24h" as ReminderTemplateKey,
        body.reminder24h,
      );
    }
    if (body.reminder1h !== undefined) {
      await saveTenantReminderTemplate(
        tenant.id,
        "reminder_1h" as ReminderTemplateKey,
        body.reminder1h,
      );
    }

    const templates = await getTenantReminderTemplates(tenant.id);
    return NextResponse.json({ data: templates });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid body", details: error.errors },
        { status: 400 },
      );
    }
    console.error("notification templates PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
