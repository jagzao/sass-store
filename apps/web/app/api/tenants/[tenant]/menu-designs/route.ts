import { NextRequest, NextResponse } from "next/server";
import { auth } from "@sass-store/config/auth";
import { db } from "@sass-store/database";
import { menuDesigns } from "@sass-store/database/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createMenuSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  content: z.record(z.any()), // JSON content from Tiptap
  templateId: z.string().optional(),
  dimensions: z
    .object({
      width: z.number(),
      height: z.number(),
    })
    .optional(),
});

// GET /api/tenants/[tenant]/menu-designs - List designs
export async function GET(
  request: NextRequest,
  { params }: { params: { tenant: string } },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantSlug = params.tenant;

    // Get tenant ID from slug (simplified for brevity, usually middleware handles handle tenant resolution)
    const tenant = await db.query.tenants.findFirst({
      where: (tenants, { eq }) => eq(tenants.slug, tenantSlug),
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const designs = await db
      .select()
      .from(menuDesigns)
      .where(eq(menuDesigns.tenantId, tenant.id))
      .orderBy(desc(menuDesigns.updatedAt));

    return NextResponse.json(designs);
  } catch (error) {
    console.error("Error fetching menu designs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/tenants/[tenant]/menu-designs - Create design
export async function POST(
  request: NextRequest,
  { params }: { params: { tenant: string } },
) {
  try {
    const tenantSlug = params.tenant;
    console.log(`[API] Creando menú para tenant: ${tenantSlug}`);

    const session = await auth();
    if (!session) {
      console.log("[API] Unauthorized: No session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("[API] Body recibido:", JSON.stringify(body, null, 2));

    const validatedData = createMenuSchema.parse(body);

    const tenant = await db.query.tenants.findFirst({
      where: (tenants, { eq }) => eq(tenants.slug, tenantSlug),
    });

    if (!tenant) {
      console.log(`[API] Tenant no encontrado: ${tenantSlug}`);
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    console.log(`[API] Tenant ID encontrado: ${tenant.id}`);

    try {
      const [newDesign] = await db
        .insert(menuDesigns)
        .values({
          tenantId: tenant.id,
          name: validatedData.name,
          description: validatedData.description,
          content: validatedData.content,
          templateId: validatedData.templateId || "custom",
          dimensions: validatedData.dimensions,
        })
        .returning();

      console.log(`[API] Diseño creado exitosamente: ${newDesign.id}`);
      return NextResponse.json(newDesign);
    } catch (dbError: any) {
      console.error("[API] Error de base de datos al insertar menú:", dbError);
      console.error(
        "[API] Detalle del error:",
        JSON.stringify(dbError, null, 2),
      );
      return NextResponse.json(
        { error: "Database error", details: dbError.message },
        { status: 500 },
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[API] Error de validación Zod:", error.errors);
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[API] Error general creando menú:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
