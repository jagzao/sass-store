import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@sass-store/database";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";

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

    // Obtener productId de los params
    const { productId } = context.params;

    // Obtener inventario
    const inventory = await InventoryService.getInventoryByProductId(
      tenantId,
      productId,
    );

    if (!inventory) {
      return NextResponse.json(
        { error: "Inventario no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(inventory);
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

    // Obtener productId de los params
    const { productId } = context.params;

    // Parsear y validar body
    const body = await request.json();
    const validatedData = updateInventorySchema.parse(body);

    // Actualizar inventario
    const result = await InventoryService.updateInventory(
      tenantId,
      productId,
      validatedData,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error en PUT /api/inventory/[productId]:", error);

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
 * DELETE /api/inventory/[productId] - Eliminar inventario de un producto
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

    // Obtener productId de los params
    const { productId } = context.params;

    // Eliminar inventario
    const result = await InventoryService.deleteInventory(tenantId, productId);

    if (!result) {
      return NextResponse.json(
        { error: "Inventario no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Inventario eliminado exitosamente",
      inventory: result,
    });
  } catch (error) {
    console.error("Error en DELETE /api/inventory/[productId]:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
