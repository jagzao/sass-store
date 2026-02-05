import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { InventoryService } from "@/lib/inventory/inventory-service";

/**
 * GET /api/inventory/transactions - Obtener todas las transacciones de inventario
 */
export async function GET(request: NextRequest) {
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

    // Obtener parámetros de consulta
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    const transactionType = searchParams.get("transactionType");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : undefined;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!, 10)
      : undefined;

    // Obtener transacciones de inventario
    const transactions = await InventoryService.getInventoryTransactions(
      tenantId,
      {
        productId,
        transactionType,
        limit,
        offset,
      },
    );

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error en GET /api/inventory/transactions:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
