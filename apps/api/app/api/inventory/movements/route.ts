import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";

// Esquemas de validación
const createInventoryMovementSchema = z.object({
  productId: z.string().min(1, "El ID del producto es requerido"),
  quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
  type: z.enum(["in", "out"], {
    errorMap: () => ({ message: "El tipo debe ser 'in' o 'out'" }),
  }),
  reason: z
    .string()
    .min(1, "La razón es requerida")
    .max(100, "La razón no puede exceder 100 caracteres"),
  notes: z
    .string()
    .max(500, "Las notas no pueden exceder 500 caracteres")
    .optional(),
  referenceId: z.string().optional(),
  referenceType: z
    .string()
    .max(50, "El tipo de referencia no puede exceder 50 caracteres")
    .optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/inventory/movements - Obtener todos los movimientos de inventario
 */
export async function GET(request: NextRequest) {
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

    // Obtener parámetros de consulta
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    const type = searchParams.get("type") as "in" | "out" | null;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : undefined;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!, 10)
      : undefined;

    // Obtener movimientos de inventario
    const movements = await InventoryService.getInventoryMovements(tenantId, {
      productId,
      type,
      limit,
      offset,
    });

    return NextResponse.json(movements);
  } catch (error) {
    console.error("Error en GET /api/inventory/movements:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/inventory/movements - Crear un nuevo movimiento de inventario
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
    const validatedData = createInventoryMovementSchema.parse(body);

    // Crear movimiento de inventario
    const movement = await InventoryService.createInventoryMovement({
      tenantId,
      ...validatedData,
    });

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/inventory/movements:", error);

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
