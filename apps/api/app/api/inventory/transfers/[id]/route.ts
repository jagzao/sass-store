import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";

// Esquemas de validación
const updateInventoryTransferSchema = z.object({
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled"], {
      errorMap: () => ({
        message:
          "El estado debe ser 'pending', 'in_progress', 'completed' o 'cancelled'",
      }),
    })
    .optional(),
  notes: z
    .string()
    .max(500, "Las notas no pueden exceder 500 caracteres")
    .optional(),
  metadata: z.record(z.any()).optional(),
});

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/inventory/transfers/[id] - Obtener una transferencia de inventario por ID
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

    const transferId = context.params.id;

    // Obtener transferencia de inventario
    const transfer = await InventoryService.getInventoryTransferById(
      tenantId,
      transferId,
    );

    if (!transfer) {
      return NextResponse.json(
        { error: "Transferencia de inventario no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(transfer);
  } catch (error) {
    console.error(`Error en GET /api/inventory/transfers/[id]:`, error);

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

    const transferId = context.params.id;

    // Parsear y validar body
    const body = await request.json();
    const validatedData = updateInventoryTransferSchema.parse(body);

    // Actualizar transferencia de inventario
    const transfer = await InventoryService.updateInventoryTransfer(
      tenantId,
      transferId,
      validatedData,
    );

    return NextResponse.json(transfer);
  } catch (error) {
    console.error(`Error en PUT /api/inventory/transfers/[id]:`, error);

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
 * DELETE /api/inventory/transfers/[id] - Eliminar una transferencia de inventario
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

    const transferId = context.params.id;

    // Eliminar transferencia de inventario
    const transfer = await InventoryService.deleteInventoryTransfer(
      tenantId,
      transferId,
    );

    if (!transfer) {
      return NextResponse.json(
        { error: "Transferencia de inventario no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Transferencia de inventario eliminada exitosamente",
    });
  } catch (error) {
    console.error(`Error en DELETE /api/inventory/transfers/[id]:`, error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
