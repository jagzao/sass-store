import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { services, tenants } from "@sass-store/database/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const createServiceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  shortDescription: z.string().max(140).optional(),
  longDescription: z.string().optional(),
  price: z.number().positive(),
  imageUrl: z.union([z.string().url(), z.literal("")]).optional(),
  videoUrl: z.union([z.string().url(), z.literal("")]).optional(),
  duration: z.number().positive(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: tenantSlug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get("includeInactive") === "true";
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "100", 10),
      1000,
    );
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const conditions = [eq(services.tenantId, tenant.id)];

    if (!includeInactive) {
      conditions.push(eq(services.active, true));
    }

    const data = await db
      .select()
      .from(services)
      .where(and(...conditions))
      .orderBy(desc(services.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[API] Error fetching services:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: tenantSlug } = await params;

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await request.json();
    const serviceData = createServiceSchema.parse(body);

    const formattedPrice = serviceData.price.toFixed(2);

    const [newService] = await db
      .insert(services)
      .values({
        tenantId: tenant.id,
        name: serviceData.name,
        description: serviceData.description || null,
        shortDescription: serviceData.shortDescription || null,
        longDescription: serviceData.longDescription || null,
        price: formattedPrice,
        imageUrl: serviceData.imageUrl || null,
        videoUrl: serviceData.videoUrl || null,
        duration: String(serviceData.duration),
        featured: serviceData.featured,
        active: serviceData.active,
        metadata: serviceData.metadata || null,
      })
      .returning({
        id: services.id,
        tenantId: services.tenantId,
        name: services.name,
        description: services.description,
        shortDescription: services.shortDescription,
        longDescription: services.longDescription,
        price: services.price,
        imageUrl: services.imageUrl,
        duration: services.duration,
        featured: services.featured,
        active: services.active,
        metadata: services.metadata,
        createdAt: services.createdAt,
        updatedAt: services.updatedAt,
      });

    return NextResponse.json({ data: newService }, { status: 201 });
  } catch (error) {
    console.error("Services POST error:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : "Unknown error",
    );
    console.error(
      "Stack trace:",
      error instanceof Error ? error.message : "Unknown error",
    );

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
