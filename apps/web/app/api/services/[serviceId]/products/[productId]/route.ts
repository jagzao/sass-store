import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@sass-store/database";
import { InventoryService } from "@/lib/inventory/inventory-service";

interface RouteParams {
  params: {
    serviceId: string;
    productId: string;
  };
}

/**
 * DELETE /api/services/[serviceId]/products/[productId] - Eliminar producto de servicio
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener tenant del usuario
    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant no encontrado" },
        { status: 400 },
      );
    }

    // Obtener serviceId y productId de los params
    const { serviceId, productId } = context.params;

    // Eliminar producto de servicio
    const result = await InventoryService.removeProductFromService(
      tenantId,
      serviceId,
      productId,
    );

    if (!result) {
      return NextResponse.json(
        { error: "Relación producto-servicio no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Producto eliminado del servicio exitosamente",
      relation: result,
    });
  } catch (error) {
    console.error(
      "Error en DELETE /api/services/[serviceId]/products/[productId]:",
      error,
    );

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
