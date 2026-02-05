import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";

// Esquemas de validación
const acknowledgeAlertSchema = z.object({
  isAcknowledged: z.boolean().default(true),
  acknowledgedBy: z.string().optional(),
  acknowledgedNotes: z
    .string()
    .max(500, "Las notas no pueden exceder 500 caracteres")
    .optional(),
});

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/inventory/alerts/[id] - Obtener una alerta de inventario por ID
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

    const alertId = context.params.id;

    // Obtener alerta de inventario
    const alert = await InventoryService.getInventoryAlertById(
      tenantId,
      alertId,
    );

    if (!alert) {
      return NextResponse.json(
        { error: "Alerta de inventario no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(alert);
  } catch (error) {
    console.error(`Error en GET /api/inventory/alerts/[id]:`, error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/inventory/alerts/[id] - Actualizar una alerta de inventario (reconocimiento)
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

    const alertId = context.params.id;

    // Parsear y validar body
    const body = await request.json();
    const validatedData = acknowledgeAlertSchema.parse(body);

    // Actualizar alerta de inventario
    const alert = await InventoryService.acknowledgeInventoryAlert(
      tenantId,
      alertId,
      validatedData,
    );

    if (!alert) {
      return NextResponse.json(
        { error: "Alerta de inventario no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(alert);
  } catch (error) {
    console.error(`Error en PUT /api/inventory/alerts/[id]:`, error);

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
