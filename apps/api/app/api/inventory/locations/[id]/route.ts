import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";

// Esquemas de validación
const updateInventoryLocationSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .optional(),
  code: z
    .string()
    .min(1, "El código es requerido")
    .max(20, "El código no puede exceder 20 caracteres")
    .optional(),
  type: z
    .enum(["warehouse", "store", "office", "other"], {
      errorMap: () => ({
        message: "El tipo debe ser 'warehouse', 'store', 'office' u 'other'",
      }),
    })
    .optional(),
  address: z
    .string()
    .max(200, "La dirección no puede exceder 200 caracteres")
    .optional(),
  city: z
    .string()
    .max(100, "La ciudad no puede exceder 100 caracteres")
    .optional(),
  state: z
    .string()
    .max(100, "El estado no puede exceder 100 caracteres")
    .optional(),
  country: z
    .string()
    .max(100, "El país no puede exceder 100 caracteres")
    .optional(),
  phone: z
    .string()
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  manager: z
    .string()
    .max(100, "El nombre del gerente no puede exceder 100 caracteres")
    .optional(),
  capacity: z
    .number()
    .min(0, "La capacidad debe ser mayor o igual a 0")
    .optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/inventory/locations/[id] - Obtener una ubicación de inventario por ID
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

    const locationId = context.params.id;

    // Obtener ubicación de inventario
    const location = await InventoryService.getInventoryLocationById(
      tenantId,
      locationId,
    );

    if (!location) {
      return NextResponse.json(
        { error: "Ubicación de inventario no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(location);
  } catch (error) {
    console.error(`Error en GET /api/inventory/locations/[id]:`, error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/inventory/locations/[id] - Actualizar una ubicación de inventario
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

    const locationId = context.params.id;

    // Parsear y validar body
    const body = await request.json();
    const validatedData = updateInventoryLocationSchema.parse(body);

    // Actualizar ubicación de inventario
    const location = await InventoryService.updateInventoryLocation(
      tenantId,
      locationId,
      validatedData,
    );

    return NextResponse.json(location);
  } catch (error) {
    console.error(`Error en PUT /api/inventory/locations/[id]:`, error);

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
 * DELETE /api/inventory/locations/[id] - Eliminar una ubicación de inventario
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

    const locationId = context.params.id;

    // Eliminar ubicación de inventario
    const location = await InventoryService.deleteInventoryLocation(
      tenantId,
      locationId,
    );

    if (!location) {
      return NextResponse.json(
        { error: "Ubicación de inventario no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Ubicación de inventario eliminada exitosamente",
    });
  } catch (error) {
    console.error(`Error en DELETE /api/inventory/locations/[id]:`, error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
