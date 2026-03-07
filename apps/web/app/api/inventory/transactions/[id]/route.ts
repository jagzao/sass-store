import { NextRequest, NextResponse } from "next/server";
import { InventoryService } from "@/lib/inventory/inventory-service";
import {
  resolveInventoryTenantContext,
  toInventoryErrorResponse,
} from "../../_lib/tenant-context";

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/inventory/transactions/[id] - Obtener una transacción de inventario por ID
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const transactionId = context.params.id;

    // Get inventory transaction by ID
    const result = await InventoryService.getInventoryTransactionById(
      tenantContext.data.tenantId,
      transactionId,
    );

    if (!result.success) {
      return toInventoryErrorResponse(result.error);
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error en GET /api/inventory/transactions/[id]:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
