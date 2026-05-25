import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { products, services, tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { auth } from "@sass-store/config/auth";

const saveSchema = z.object({
  tenant: z.string().min(1),
  type: z.enum(["product", "service"]),
  name: z.string().min(1).max(200),
  description: z.string().optional().default(""),
  category: z.string().min(1).max(50).default("General"),
  price: z.number().positive(),
  imageUrl: z.string().url().nullable().optional(),
  sku: z.string().optional(),
  duration: z.number().positive().optional(),
  shortDescription: z.string().max(140).optional().default(""),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = saveSchema.parse(body);

    // Resolve tenant
    const [tenant] = await db
      .select({ id: tenants.id, slug: tenants.slug })
      .from(tenants)
      .where(eq(tenants.slug, data.tenant))
      .limit(1);

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant no encontrado" },
        { status: 404 },
      );
    }

    const metadata = {
      generatedBy: "smart-publish",
      shortDescription: data.shortDescription || "",
    };

    if (data.type === "product") {
      const sku =
        data.sku?.trim() || `SP-${Date.now().toString(36).toUpperCase()}`;

      const [newProduct] = await db
        .insert(products)
        .values({
          tenantId: tenant.id,
          sku,
          name: data.name,
          description: data.description || null,
          price: data.price.toFixed(2),
          category: data.category,
          imageUrl: data.imageUrl || null,
          featured: false,
          active: true,
          metadata,
        })
        .returning({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          category: products.category,
          imageUrl: products.imageUrl,
          sku: products.sku,
          createdAt: products.createdAt,
        });

      return NextResponse.json(
        { success: true, type: "product", data: newProduct },
        { status: 201 },
      );
    }

    // Service
    const [newService] = await db
      .insert(services)
      .values({
        tenantId: tenant.id,
        name: data.name,
        description: data.description || null,
        price: data.price.toFixed(2),
        duration: String(data.duration ?? 1),
        imageUrl: data.imageUrl || null,
        featured: false,
        active: true,
        metadata,
      })
      .returning({
        id: services.id,
        name: services.name,
        description: services.description,
        price: services.price,
        imageUrl: services.imageUrl,
        duration: services.duration,
        createdAt: services.createdAt,
      });

    return NextResponse.json(
      { success: true, type: "service", data: newService },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Smart publish save error", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Error al guardar",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}
