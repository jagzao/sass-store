import { NextRequest, NextResponse } from "next/server";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";
import {
  resolveInventoryTenantContext,
  toInventoryErrorResponse,
} from "../../_lib/tenant-context";

interface RouteParams {
  params: { id: string };
}

// Validation schema for update
const updateTransferSchema = z.object({
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled"])
    .optional(),
  notes: z
    .string()
    .max(500, "Las notas no pueden exceder 500 caracteres")
    .optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/inventory/transfers/[id] - Obtener una transferencia de inventario por ID
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const transferId = context.params.id;

    // Get inventory transfer by ID
    const result = await InventoryService.getInventoryTransferById(
      tenantContext.data.tenantId,
      transferId,
    );

    if (!result.success) {
      return toInventoryErrorResponse(result.error);
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error en GET /api/inventory/transfers/[id]:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/inventory/transfers/[id] - Actualizar una transferencia de inventario
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const transferId = context.params.id;

    // Parse and validate body
    const body = await request.json();
    const validatedData = updateTransferSchema.parse(body);

    // Update inventory transfer
    const result = await InventoryService.updateInventoryTransfer(
      tenantContext.data.tenantId,
      transferId,
      validatedData,
    );

    if (!result.success) {
      return toInventoryErrorResponse(result.error);
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error en PUT /api/inventory/transfers/[id]:", error);

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

/**
 * DELETE /api/inventory/transfers/[id] - Eliminar una transferencia de inventario
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const transferId = context.params.id;

    // Delete inventory transfer
    const result = await InventoryService.deleteInventoryTransfer(
      tenantContext.data.tenantId,
      transferId,
    );

    if (!result.success) {
      return toInventoryErrorResponse(result.error);
    }

    return NextResponse.json({
      message: "Transferencia de inventario eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error en DELETE /api/inventory/transfers/[id]:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
