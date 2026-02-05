import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";

// Esquemas de validación
const createSupplierSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  contactPerson: z.string().max(100).optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

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

/**
 * GET /api/inventory/suppliers - Obtener todos los proveedores
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

    // Obtener proveedores
    const suppliers = await InventoryService.getSuppliers(tenantId);

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Error en GET /api/inventory/suppliers:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/inventory/suppliers - Crear un nuevo proveedor
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
    const validatedData = createSupplierSchema.parse(body);

    // Crear proveedor
    const supplier = await InventoryService.createSupplier({
      tenantId,
      ...validatedData,
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/inventory/suppliers:", error);

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
