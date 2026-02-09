import { NextRequest, NextResponse } from "next/server";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";
import {
  resolveInventoryTenantContext,
  toInventoryErrorResponse,
} from "../_lib/tenant-context";

// Esquemas de validación
const updateInventorySchema = z.object({
  quantity: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  reorderLevel: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  reorderQuantity: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  unitCost: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  location: z.string().max(100).optional(),
  metadata: z.record(z.any()).optional(),
});

interface RouteParams {
  params: {
    productId: string;
  };
}

/**
 * GET /api/inventory/[productId] - Obtener inventario de un producto específico
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    // Obtener productId de los params
    const { productId } = context.params;

    // Obtener inventario
    const inventory = await InventoryService.getInventoryByProductId(
      tenantContext.data.tenantId,
      productId,
    );

    if (!inventory.success) {
      return toInventoryErrorResponse(inventory.error);
    }

    return NextResponse.json(inventory.data);
  } catch (error) {
    console.error("Error en GET /api/inventory/[productId]:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/inventory/[productId] - Actualizar inventario de un producto
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    // Obtener productId de los params
    const { productId } = context.params;

    // Parsear y validar body
    const body = await request.json();
    const validatedData = updateInventorySchema.parse(body);

    // Actualizar inventario
    const result = await InventoryService.updateInventory(
      tenantContext.data.tenantId,
      productId,
      validatedData,
    );

    if (!result.success) {
      return toInventoryErrorResponse(result.error);
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error en PUT /api/inventory/[productId]:", error);

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
 * DELETE /api/inventory/[productId] - Eliminar inventario de un producto
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    // Obtener productId de los params
    const { productId } = context.params;

    // Eliminar inventario
    const result = await InventoryService.deleteInventory(
      tenantContext.data.tenantId,
      productId,
    );

    if (!result.success) {
      return toInventoryErrorResponse(result.error);
    }

    return NextResponse.json({
      message: "Inventario eliminado exitosamente",
      inventory: result.data,
    });
  } catch (error) {
    console.error("Error en DELETE /api/inventory/[productId]:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
