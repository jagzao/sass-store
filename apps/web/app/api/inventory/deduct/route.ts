import { NextRequest, NextResponse } from "next/server";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";
import {
  resolveInventoryTenantContext,
  toInventoryErrorResponse,
} from "../_lib/tenant-context";

// Esquemas de validación
const bodySchema = z.object({
  serviceId: z.string().uuid(),
  products: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().positive(),
    }),
  ),
  notes: z.string().max(500).optional(),
});

/**
 * POST /api/inventory/deduct - Deducir inventario automáticamente al completar servicio
 */
export async function POST(request: NextRequest) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    // Parsear y validar body
    const body = await request.json();
    const validatedData = bodySchema.parse(body);

    // Deducir inventario para el servicio
    const result = await InventoryService.deductInventoryForService(
      tenantContext.data.tenantId,
      validatedData.serviceId,
      validatedData.products,
      validatedData.notes,
    );

    if (!result.success) {
      return toInventoryErrorResponse(result.error);
    }

    return NextResponse.json({
      message: "Inventario deducido exitosamente",
      transactions: result.data.transactions,
      alerts: result.data.alerts,
    });
  } catch (error) {
    console.error("Error en POST /api/inventory/deduct:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
