import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";

// Esquemas de validación
const updateSupplierSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .optional(),
  contactPerson: z.string().max(100).optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/inventory/suppliers/[id] - Obtener un proveedor por ID
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

    const supplierId = context.params.id;

    // Obtener proveedor
    const supplier = await InventoryService.getSupplierById(
      tenantId,
      supplierId,
    );

    if (!supplier) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error(`Error en GET /api/inventory/suppliers/[id]:`, error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/inventory/suppliers/[id] - Actualizar un proveedor
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

    const supplierId = context.params.id;

    // Parsear y validar body
    const body = await request.json();
    const validatedData = updateSupplierSchema.parse(body);

    // Actualizar proveedor
    const supplier = await InventoryService.updateSupplier(
      tenantId,
      supplierId,
      validatedData,
    );

    return NextResponse.json(supplier);
  } catch (error) {
    console.error(`Error en PUT /api/inventory/suppliers/[id]:`, error);

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
 * DELETE /api/inventory/suppliers/[id] - Eliminar un proveedor
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

    const supplierId = context.params.id;

    // Eliminar proveedor
    const supplier = await InventoryService.deleteSupplier(
      tenantId,
      supplierId,
    );

    if (!supplier) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Proveedor eliminado exitosamente" });
  } catch (error) {
    console.error(`Error en DELETE /api/inventory/suppliers/[id]:`, error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
