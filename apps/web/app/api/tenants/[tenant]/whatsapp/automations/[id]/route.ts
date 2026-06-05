/**
 * PATCH  /api/tenants/[tenant]/whatsapp/automations/[id]  — toggle enabled / update
 * DELETE /api/tenants/[tenant]/whatsapp/automations/[id]
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { waAutomationRules } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  name: z.string().min(1).optional(),
  actionConfig: z.record(z.unknown()).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  try {
    const { tenant: slug, id } = await params;
    const parsed = patchSchema.parse(await request.json());

    const [updated] = await db
      .update(waAutomationRules)
      .set({ ...parsed, updatedAt: new Date() })
      .where(
        and(
          eq(waAutomationRules.id, id),
          eq(waAutomationRules.tenantSlug, slug),
        ),
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Regla no encontrada" },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: err.errors },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  const { tenant: slug, id } = await params;
  await db
    .delete(waAutomationRules)
    .where(
      and(eq(waAutomationRules.id, id), eq(waAutomationRules.tenantSlug, slug)),
    );
  return NextResponse.json({ success: true });
}
