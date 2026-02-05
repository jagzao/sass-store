import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { InventoryService } from "@/lib/inventory/inventory-service";

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/inventory/transactions/[id] - Obtener una transacción de inventario por ID
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

    const transactionId = context.params.id;

    // Obtener transacción de inventario
    const transaction = await InventoryService.getInventoryTransactionById(
      tenantId,
      transactionId,
    );

    if (!transaction) {
      return NextResponse.json(
        { error: "Transacción de inventario no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error(`Error en GET /api/inventory/transactions/[id]:`, error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
