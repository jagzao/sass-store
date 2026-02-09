import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { products, serviceProducts, services } from "@sass-store/database/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  resolveInventoryTenantContext,
  toInventoryErrorResponse,
} from "../../_lib/tenant-context";

const addServiceLinkSchema = z.object({
  serviceId: z.string().uuid("ID de servicio inválido"),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
  optional: z.boolean().optional().default(false),
});

interface RouteParams {
  params: {
    productId: string;
  };
}

const getRelationsAndServices = async (tenantId: string, productId: string) => {
  const [relations, serviceOptions] = await Promise.all([
    db
      .select({
        id: serviceProducts.id,
        serviceId: serviceProducts.serviceId,
        serviceName: services.name,
        quantity: serviceProducts.quantity,
        optional: serviceProducts.optional,
        createdAt: serviceProducts.createdAt,
      })
      .from(serviceProducts)
      .innerJoin(services, eq(serviceProducts.serviceId, services.id))
      .where(
        and(
          eq(serviceProducts.tenantId, tenantId),
          eq(serviceProducts.productId, productId),
        ),
      ),
    db
      .select({
        id: services.id,
        name: services.name,
        price: services.price,
        duration: services.duration,
        active: services.active,
      })
      .from(services)
      .where(and(eq(services.tenantId, tenantId), eq(services.active, true))),
  ]);

  return {
    relations: relations.map((relation) => ({
      ...relation,
      quantity: Number(relation.quantity),
      optional: relation.optional ?? false,
    })),
    services: serviceOptions.map((service) => ({
      ...service,
      price: Number(service.price),
      duration: Number(service.duration),
      active: service.active ?? true,
    })),
  };
};

/**
 * GET /api/inventory/[productId]/services
 * Lista servicios vinculados a un producto y catálogo de servicios disponibles.
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const { productId } = context.params;

    const product = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.tenantId, tenantContext.data.tenantId), eq(products.id, productId)))
      .limit(1);

    if (!product[0]) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const data = await getRelationsAndServices(tenantContext.data.tenantId, productId);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error en GET /api/inventory/[productId]/services:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/inventory/[productId]/services
 * Crea una vinculación producto-servicio para descuento por servicio.
 */
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const { productId } = context.params;
    const body = await request.json();
    const validatedData = addServiceLinkSchema.parse(body);

    const [product, service] = await Promise.all([
      db
        .select({ id: products.id })
        .from(products)
        .where(
          and(
            eq(products.tenantId, tenantContext.data.tenantId),
            eq(products.id, productId),
          ),
        )
        .limit(1),
      db
        .select({ id: services.id })
        .from(services)
        .where(
          and(
            eq(services.tenantId, tenantContext.data.tenantId),
            eq(services.id, validatedData.serviceId),
          ),
        )
        .limit(1),
    ]);

    if (!product[0]) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    if (!service[0]) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    const existing = await db
      .select({ id: serviceProducts.id })
      .from(serviceProducts)
      .where(
        and(
          eq(serviceProducts.tenantId, tenantContext.data.tenantId),
          eq(serviceProducts.serviceId, validatedData.serviceId),
          eq(serviceProducts.productId, productId),
        ),
      )
      .limit(1);

    if (existing[0]) {
      return NextResponse.json(
        { error: "El producto ya está vinculado a este servicio" },
        { status: 409 },
      );
    }

    await db.insert(serviceProducts).values({
      tenantId: tenantContext.data.tenantId,
      serviceId: validatedData.serviceId,
      productId,
      quantity: validatedData.quantity.toString(),
      optional: validatedData.optional,
      metadata: {},
    });

    const data = await getRelationsAndServices(tenantContext.data.tenantId, productId);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/inventory/[productId]/services:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error?.message || "Error interno del servidor" },
      { status: 500 },
    );
  }
}

