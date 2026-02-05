import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@sass-store/database";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";

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

    // Obtener alertId de los params
    const { alertId } = context.params;

    // Obtener alerta
    const alert = await InventoryService.getInventoryAlertById(
      tenantId,
      alertId,
    );

    if (!alert) {
      return NextResponse.json(
        { error: "Alerta no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Error en GET /api/inventory/alerts/[alertId]:", error);

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
 * PUT /api/inventory/alerts/[alertId] - Actualizar alerta
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

    // Obtener alertId de los params
    const { alertId } = context.params;

    // Parsear y validar body
    const body = await request.json();
    const validatedData = bodySchema.parse(body);

    // Actualizar alerta
    const result = await InventoryService.updateInventoryAlert(
      tenantId,
      alertId,
      validatedData,
    );

    if (!result) {
      return NextResponse.json(
        { error: "Alerta no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Alerta actualizada exitosamente",
      alert: result,
    });
  } catch (error) {
    console.error("Error en PUT /api/inventory/alerts/[alertId]:", error);

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
 * DELETE /api/inventory/alerts/[alertId] - Eliminar alerta
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

    // Obtener alertId de los params
    const { alertId } = context.params;

    // Eliminar alerta
    const result = await InventoryService.deleteInventoryAlert(
      tenantId,
      alertId,
    );

    if (!result) {
      return NextResponse.json(
        { error: "Alerta no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Alerta eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error en DELETE /api/inventory/alerts/[alertId]:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
