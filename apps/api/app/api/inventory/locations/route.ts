import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";

// Esquemas de validación
const createInventoryLocationSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  code: z
    .string()
    .min(1, "El código es requerido")
    .max(20, "El código no puede exceder 20 caracteres"),
  type: z.enum(["warehouse", "store", "office", "other"], {
    errorMap: () => ({
      message: "El tipo debe ser 'warehouse', 'store', 'office' u 'other'",
    }),
  }),
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
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/inventory/locations - Obtener todas las ubicaciones de inventario
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
    const type = searchParams.get("type") as
      | "warehouse"
      | "store"
      | "office"
      | "other"
      | null;
    const isActive =
      searchParams.get("isActive") === "true"
        ? true
        : searchParams.get("isActive") === "false"
          ? false
          : null;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : undefined;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!, 10)
      : undefined;

    // Obtener ubicaciones de inventario
    const locations = await InventoryService.getInventoryLocations(tenantId, {
      type,
      isActive,
      limit,
      offset,
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error en GET /api/inventory/locations:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/inventory/locations - Crear una nueva ubicación de inventario
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
    const validatedData = createInventoryLocationSchema.parse(body);

    // Crear ubicación de inventario
    const location = await InventoryService.createInventoryLocation({
      tenantId,
      ...validatedData,
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/inventory/locations:", error);

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
