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

// GET /api/tenants/[slug]/menu-designs - List designs
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantSlug = params.slug;

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

// POST /api/tenants/[slug]/menu-designs - Create design
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantSlug = params.slug;
    const body = await request.json();
    const validatedData = createMenuSchema.parse(body);

    const tenant = await db.query.tenants.findFirst({
      where: (tenants, { eq }) => eq(tenants.slug, tenantSlug),
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

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

    return NextResponse.json(newDesign);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating menu design:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
