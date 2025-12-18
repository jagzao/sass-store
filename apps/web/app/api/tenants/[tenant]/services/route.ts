import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { services, tenants } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const createServiceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  imageUrl: z.union([z.string().url(), z.literal("")]).optional(),
  videoUrl: z.union([z.string().url(), z.literal("")]).optional(),
  duration: z.number().positive(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: tenantSlug } = await params;

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
    // Format price to ensure it has 2 decimal places
    const formattedPrice = serviceData.price.toFixed(2);

    const [newService] = await db
      .insert(services)
      .values({
        tenantId: tenant.id,
        name: serviceData.name,
        description: serviceData.description || null,
        price: formattedPrice,
        imageUrl: serviceData.imageUrl || null,
        videoUrl: serviceData.videoUrl || null,
        duration: serviceData.duration,
        featured: serviceData.featured,
        active: serviceData.active,
        metadata: serviceData.metadata || null,
      })
      .returning({
        id: services.id,
        tenantId: services.tenantId,
        name: services.name,
        description: services.description,
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
      error instanceof Error ? error.stack : "No stack trace",
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
