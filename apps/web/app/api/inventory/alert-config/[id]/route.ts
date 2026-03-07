import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  resolveInventoryTenantContext,
  toInventoryErrorResponse,
} from "../../_lib/tenant-context";
import { inventoryService } from "@/lib/services/InventoryServiceResultPattern";
import { isSuccess } from "@sass-store/core/src/result";

// Validation schemas
const updateAlertConfigSchema = z.object({
  lowStockThreshold: z.string().optional(),
  lowStockEnabled: z.boolean().optional(),
  outOfStockEnabled: z.boolean().optional(),
  overstockThreshold: z.string().optional(),
  overstockEnabled: z.boolean().optional(),
  expiryWarningDays: z.number().min(1).max(365).optional(),
  expiryWarningEnabled: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/inventory/alert-config/[id] - Obtener una configuración de alerta de inventario por ID
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const configId = context.params.id;

    // Obtener configuración de alerta de inventario
    const result = await inventoryService.getDatabase().getAlertConfig(configId);

    if (!result) {
      return NextResponse.json(
        { error: "Configuración de alerta de inventario no encontrada" },
        { status: 404 },
      );
    }

    // Verify tenant ownership
    if (result.tenantId !== tenantContext.data.tenantId) {
      return NextResponse.json(
        { error: "Configuración de alerta de inventario no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error en GET /api/inventory/alert-config/[id]:`, error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/inventory/alert-config/[id] - Actualizar una configuración de alerta de inventario
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const configId = context.params.id;

    // Check existing config
    const existing = await inventoryService.getDatabase().getAlertConfig(configId);
    if (!existing) {
      return NextResponse.json(
        { error: "Configuración de alerta de inventario no encontrada" },
        { status: 404 },
      );
    }

    // Verify tenant ownership
    if (existing.tenantId !== tenantContext.data.tenantId) {
      return NextResponse.json(
        { error: "Configuración de alerta de inventario no encontrada" },
        { status: 404 },
      );
    }

    // Parsear y validar body
    const body = await request.json();
    const validatedData = updateAlertConfigSchema.parse(body);

    // Actualizar configuración de alerta de inventario
    const updated = await inventoryService.getDatabase().updateAlertConfig(configId, validatedData);

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`Error en PUT /api/inventory/alert-config/[id]:`, error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/inventory/alert-config/[id] - Eliminar una configuración de alerta de inventario
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const configId = context.params.id;

    // Check existing config
    const existing = await inventoryService.getDatabase().getAlertConfig(configId);
    if (!existing) {
      return NextResponse.json(
        { error: "Configuración de alerta de inventario no encontrada" },
        { status: 404 },
      );
    }

    // Verify tenant ownership
    if (existing.tenantId !== tenantContext.data.tenantId) {
      return NextResponse.json(
        { error: "Configuración de alerta de inventario no encontrada" },
        { status: 404 },
      );
    }

    // Note: The InventoryServiceWithResultPattern doesn't have a deleteAlertConfig method
    // For now, we'll mark it as inactive instead
    await inventoryService.getDatabase().updateAlertConfig(configId, { isActive: false });

    return NextResponse.json({
      message: "Configuración de alerta de inventario eliminada exitosamente",
    });
  } catch (error) {
    console.error(`Error en DELETE /api/inventory/alert-config/[id]:`, error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
