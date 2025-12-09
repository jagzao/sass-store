import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { services, tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Force dynamic rendering
export const dynamic = "force-dynamic";

const createServiceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  imageUrl: z.string().url().optional(),
  duration: z.number().int().positive(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug: tenantSlug } = await params;

    // Find tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Get all services for tenant
    const servicesList = await db
      .select()
      .from(services)
      .where(eq(services.tenantId, tenant.id));

    return NextResponse.json({ data: servicesList });
  } catch (error) {
    console.error("Services GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug: tenantSlug } = await params;

    // Find tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const serviceData = createServiceSchema.parse(body);

    // Create service
    const [newService] = await db
      .insert(services)
      .values({
        tenantId: tenant.id,
        name: serviceData.name,
        description: serviceData.description || null,
        price: serviceData.price.toString(),
        imageUrl: serviceData.imageUrl || null,
        duration: serviceData.duration,
        featured: serviceData.featured,
        active: serviceData.active,
        metadata: serviceData.metadata || null,
      })
      .returning();

    return NextResponse.json({ data: newService }, { status: 201 });
  } catch (error) {
    console.error("Services POST error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
