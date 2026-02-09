import { NextRequest, NextResponse } from "next/server";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";
import {
  resolveInventoryTenantContext,
  toInventoryErrorResponse,
} from "../../_lib/tenant-context";

interface RouteParams {
  params: {
    alertId: string;
  };
}

const bodySchema = z.object({
  resolved: z.boolean().optional().default(true),
  resolutionNote: z.string().max(500).optional(),
});

/**
 * GET /api/inventory/alerts/[alertId] - Obtener alerta específica
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    // Obtener alertId de los params
    const { alertId } = context.params;

    // Obtener alerta
    const alert = await InventoryService.getInventoryAlertById(
      tenantContext.data.tenantId,
      alertId,
    );

    if (!alert.success) {
      return toInventoryErrorResponse(alert.error);
    }

    return NextResponse.json(alert.data);
  } catch (error) {
    console.error("Error en GET /api/inventory/alerts/[alertId]:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/inventory/alerts/[alertId] - Actualizar alerta
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    // Obtener alertId de los params
    const { alertId } = context.params;

    // Parsear y validar body
    const body = await request.json();
    const validatedData = bodySchema.parse(body);

    // Actualizar alerta
    const result = await InventoryService.updateInventoryAlert(
      tenantContext.data.tenantId,
      alertId,
      {
        resolved: validatedData.resolved,
        resolutionNote: validatedData.resolutionNote,
      },
    );

    if (!result.success) {
      return toInventoryErrorResponse(result.error);
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error en PUT /api/inventory/alerts/[alertId]:", error);

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
 * DELETE /api/inventory/alerts/[alertId] - Eliminar alerta
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    // Obtener alertId de los params
    const { alertId } = context.params;

    // Eliminar alerta
    const result = await InventoryService.deleteInventoryAlert(
      tenantContext.data.tenantId,
      alertId,
    );

    if (!result.success) {
      return toInventoryErrorResponse(result.error);
    }

    return NextResponse.json({ message: "Alerta eliminada exitosamente" });
  } catch (error) {
    console.error("Error en DELETE /api/inventory/alerts/[alertId]:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
