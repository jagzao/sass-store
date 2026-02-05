import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { InventoryService } from "@/lib/inventory/inventory-service";

/**
 * GET /api/inventory/alerts - Obtener todas las alertas de inventario
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
    const alertType = searchParams.get("alertType");
    const isAcknowledged =
      searchParams.get("isAcknowledged") === "true"
        ? true
        : searchParams.get("isAcknowledged") === "false"
          ? false
          : null;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : undefined;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!, 10)
      : undefined;

    // Obtener alertas de inventario
    const alerts = await InventoryService.getInventoryAlerts(tenantId, {
      productId,
      alertType,
      isAcknowledged,
      limit,
      offset,
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error en GET /api/inventory/alerts:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
