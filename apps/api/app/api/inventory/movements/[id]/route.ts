import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { InventoryService } from "@/lib/inventory/inventory-service";

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/inventory/movements/[id] - Obtener un movimiento de inventario por ID
 */
export async function GET(request: NextRequest, context: RouteParams) {
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

    const movementId = context.params.id;

    // Obtener movimiento de inventario
    const movement = await InventoryService.getInventoryMovementById(
      tenantId,
      movementId,
    );

    if (!movement) {
      return NextResponse.json(
        { error: "Movimiento de inventario no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(movement);
  } catch (error) {
    console.error(`Error en GET /api/inventory/movements/[id]:`, error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
