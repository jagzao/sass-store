import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";

// Esquemas de validación
const createAlertConfigSchema = z.object({
  productId: z.string().min(1, "El ID del producto es requerido"),
  minStock: z.number().min(0, "El stock mínimo debe ser mayor o igual a 0"),
  maxStock: z.number().min(0, "El stock máximo debe ser mayor o igual a 0"),
  lowStockThreshold: z
    .number()
    .min(0, "El umbral de stock bajo debe ser mayor o igual a 0"),
  highStockThreshold: z
    .number()
    .min(0, "El umbral de stock alto debe ser mayor o igual a 0"),
  expirationDays: z
    .number()
    .min(0, "Los días de expiración deben ser mayor o igual a 0")
    .optional(),
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/inventory/alert-config - Obtener todas las configuraciones de alertas de inventario
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

    // Obtener configuraciones de alertas de inventario
    const configs = await InventoryService.getInventoryAlertConfigs(tenantId, {
      productId,
      isActive,
      limit,
      offset,
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error("Error en GET /api/inventory/alert-config:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/inventory/alert-config - Crear una nueva configuración de alerta de inventario
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
    const validatedData = createAlertConfigSchema.parse(body);

    // Crear configuración de alerta de inventario
    const config = await InventoryService.createInventoryAlertConfig({
      tenantId,
      ...validatedData,
    });

    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/inventory/alert-config:", error);

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
