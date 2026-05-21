import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { tenantConfigs, tenants } from "@sass-store/database/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  getTenantNotificationTemplates,
  NOTIFICATIONS_CATEGORY,
  type NotificationTemplateKey,
} from "@/lib/notifications/notification-template";

const TEMPLATE_MSG = z.string().min(1).max(2000).optional();

const putSchema = z.object({
  // Client templates
  reminder24h: TEMPLATE_MSG,
  reminder1h: TEMPLATE_MSG,
  confirmation: TEMPLATE_MSG,
  cancelled: TEMPLATE_MSG,
  confirmed: TEMPLATE_MSG,
  noshow: TEMPLATE_MSG,
  reviewRequest: TEMPLATE_MSG,
  // Staff templates
  staffNewBooking: TEMPLATE_MSG,
  staffReminderEvening: TEMPLATE_MSG,
  staffReminder2h: TEMPLATE_MSG,
  // Staff config
  staffPhone: z
    .string()
    .regex(
      /^\d{10,15}$/,
      "Debe ser número sin espacios ni +, mínimo 10 dígitos",
    )
    .optional()
    .nullable(),
});

const FIELD_TO_KEY: Record<string, NotificationTemplateKey> = {
  reminder24h: "reminder_24h",
  reminder1h: "reminder_1h",
  confirmation: "confirmation",
  cancelled: "cancelled",
  confirmed: "confirmed",
  noshow: "noshow",
  reviewRequest: "review_request",
  staffNewBooking: "staff_new_booking",
  staffReminderEvening: "staff_reminder_evening",
  staffReminder2h: "staff_reminder_2h",
};

const PLACEHOLDERS = [
  "{{customerName}}",
  "{{tenantName}}",
  "{{serviceName}}",
  "{{appointmentDateTime}}",
  "{{customerPhone}}",
];

async function getStaffPhone(tenantId: string): Promise<string | null> {
  const [row] = await db
    .select({ value: tenantConfigs.value })
    .from(tenantConfigs)
    .where(
      and(
        eq(tenantConfigs.tenantId, tenantId),
        eq(tenantConfigs.category, NOTIFICATIONS_CATEGORY),
        eq(tenantConfigs.key, "staff_whatsapp_phone"),
      ),
    )
    .limit(1);
  if (!row) return null;
  const raw = row.value;
  return typeof raw === "string"
    ? raw
    : raw && typeof raw === "object" && "phone" in raw
      ? String((raw as { phone: unknown }).phone)
      : null;
}

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

    if (!tenant)
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const [templates, staffPhone] = await Promise.all([
      getTenantNotificationTemplates(tenant.id),
      getStaffPhone(tenant.id),
    ]);

    return NextResponse.json({
      data: { ...templates, staffPhone, placeholders: PLACEHOLDERS },
    });
  } catch (error) {
    console.error("notification templates GET:", error);
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
    const body = putSchema.parse(await request.json());

    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant)
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const ops: Promise<unknown>[] = [];

    // Save each template field
    for (const [field, templateKey] of Object.entries(FIELD_TO_KEY)) {
      const value = body[field as keyof typeof body];
      if (typeof value !== "string") continue;
      ops.push(
        db
          .insert(tenantConfigs)
          .values({
            tenantId: tenant.id,
            category: NOTIFICATIONS_CATEGORY,
            key: templateKey,
            value: { body: value.trim() },
          })
          .onConflictDoUpdate({
            target: [
              tenantConfigs.tenantId,
              tenantConfigs.category,
              tenantConfigs.key,
            ],
            set: { value: { body: value.trim() }, updatedAt: new Date() },
          }),
      );
    }

    // Save staff phone
    if (body.staffPhone !== undefined) {
      const phoneValue = body.staffPhone
        ? { phone: body.staffPhone }
        : { phone: "" };
      ops.push(
        db
          .insert(tenantConfigs)
          .values({
            tenantId: tenant.id,
            category: NOTIFICATIONS_CATEGORY,
            key: "staff_whatsapp_phone",
            value: phoneValue,
          })
          .onConflictDoUpdate({
            target: [
              tenantConfigs.tenantId,
              tenantConfigs.category,
              tenantConfigs.key,
            ],
            set: { value: phoneValue, updatedAt: new Date() },
          }),
      );
    }

    await Promise.all(ops);
    const [templates, staffPhone] = await Promise.all([
      getTenantNotificationTemplates(tenant.id),
      getStaffPhone(tenant.id),
    ]);

    return NextResponse.json({
      data: { ...templates, staffPhone, placeholders: PLACEHOLDERS },
    });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: "Invalid body", details: error.errors },
        { status: 400 },
      );
    console.error("notification templates PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
