import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { serviceProducts } from "@sass-store/database/schema";
import { and, eq } from "drizzle-orm";
import {
  resolveInventoryTenantContext,
  toInventoryErrorResponse,
} from "../../../_lib/tenant-context";

interface RouteParams {
  params: {
    productId: string;
    serviceId: string;
  };
}

/**
 * DELETE /api/inventory/[productId]/services/[serviceId]
 * Elimina una vinculación producto-servicio.
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const { productId, serviceId } = context.params;

    const deleted = await db
      .delete(serviceProducts)
      .where(
        and(
          eq(serviceProducts.tenantId, tenantContext.data.tenantId),
          eq(serviceProducts.productId, productId),
          eq(serviceProducts.serviceId, serviceId),
        ),
      )
      .returning({ id: serviceProducts.id });

    if (!deleted[0]) {
      return NextResponse.json(
        { error: "Vinculación producto-servicio no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Error en DELETE /api/inventory/[productId]/services/[serviceId]:",
      error,
    );

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

