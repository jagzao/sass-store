import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@sass-store/database";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";

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

    // Parsear y validar body
    const body = await request.json();
    const validatedData = bodySchema.parse(body);

    // Deducir inventario para el servicio
    const result = await InventoryService.deductInventoryForService(
      tenantId,
      validatedData.serviceId,
      validatedData.products,
      validatedData.notes,
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Error al deducir inventario",
          details: result.error,
          insufficientStock: result.insufficientStock,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: "Inventario deducido exitosamente",
      transactions: result.transactions,
      alerts: result.alerts,
    });
  } catch (error) {
    console.error("Error en POST /api/inventory/deduct:", error);

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
