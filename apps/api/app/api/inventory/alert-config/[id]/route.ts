import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";

// Esquemas de validación
const updateAlertConfigSchema = z.object({
  minStock: z
    .number()
    .min(0, "El stock mínimo debe ser mayor o igual a 0")
    .optional(),
  maxStock: z
    .number()
    .min(0, "El stock máximo debe ser mayor o igual a 0")
    .optional(),
  lowStockThreshold: z
    .number()
    .min(0, "El umbral de stock bajo debe ser mayor o igual a 0")
    .optional(),
  highStockThreshold: z
    .number()
    .min(0, "El umbral de stock alto debe ser mayor o igual a 0")
    .optional(),
  expirationDays: z
    .number()
    .min(0, "Los días de expiración deben ser mayor o igual a 0")
    .optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/inventory/alert-config/[id] - Obtener una configuración de alerta de inventario por ID
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

    const configId = context.params.id;

    // Obtener configuración de alerta de inventario
    const config = await InventoryService.getInventoryAlertConfigById(
      tenantId,
      configId,
    );

    if (!config) {
      return NextResponse.json(
        { error: "Configuración de alerta de inventario no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(config);
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

    const configId = context.params.id;

    // Parsear y validar body
    const body = await request.json();
    const validatedData = updateAlertConfigSchema.parse(body);

    // Actualizar configuración de alerta de inventario
    const config = await InventoryService.updateInventoryAlertConfig(
      tenantId,
      configId,
      validatedData,
    );

    if (!config) {
      return NextResponse.json(
        { error: "Configuración de alerta de inventario no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(config);
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

    const configId = context.params.id;

    // Eliminar configuración de alerta de inventario
    const config = await InventoryService.deleteInventoryAlertConfig(
      tenantId,
      configId,
    );

    if (!config) {
      return NextResponse.json(
        { error: "Configuración de alerta de inventario no encontrada" },
        { status: 404 },
      );
    }

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
