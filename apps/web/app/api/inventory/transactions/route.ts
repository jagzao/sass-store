import { NextRequest, NextResponse } from "next/server";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";
import {
  resolveInventoryTenantContext,
  toInventoryErrorResponse,
} from "../_lib/tenant-context";

// Esquemas de validación
const querySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default("20"),
  productId: z.string().uuid().optional(),
  type: z.enum(["deduction", "addition", "adjustment", "initial"]).optional(),
  referenceType: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

/**
 * GET /api/inventory/transactions - Obtener historial de transacciones de inventario
 */
export async function GET(request: NextRequest) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    // Parsear y validar query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = querySchema.parse(Object.fromEntries(searchParams));

    // Convertir fechas a objetos Date si se proporcionan
    const processedQuery = {
      ...query,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    };

    // Obtener transacciones
    const result = await InventoryService.getInventoryTransactions({
      tenantId: tenantContext.data.tenantId,
      ...processedQuery,
    });

    if (!result.success) {
      return toInventoryErrorResponse(result.error);
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error en GET /api/inventory/transactions:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
