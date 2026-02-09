import { NextRequest, NextResponse } from "next/server";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";
import {
  resolveInventoryTenantContext,
  toInventoryErrorResponse,
} from "./_lib/tenant-context";

// Esquemas de validación
const createInventorySchema = z.object({
  productId: z.string().uuid("ID de producto inválido"),
  quantity: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Cantidad debe ser un número válido"),
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

const querySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default("20"),
  search: z.string().optional(),
  category: z.string().optional(),
  lowStockOnly: z
    .string()
    .transform((val) => val === "true")
    .optional()
    .default("false"),
  sortBy: z
    .enum(["name", "quantity", "reorderLevel", "createdAt"])
    .optional()
    .default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

/**
 * GET /api/inventory - Obtener inventario de productos
 */
export async function GET(request: NextRequest) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    // Parsear y validar query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = querySchema.parse(Object.fromEntries(searchParams));

    // Obtener inventario
    const result = await InventoryService.getInventory({
      tenantId: tenantContext.data.tenantId,
      ...query,
    });

    if (!result.success) {
      return toInventoryErrorResponse(result.error);
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error en GET /api/inventory:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/inventory - Crear registro de inventario
 */
export async function POST(request: NextRequest) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    // Parsear y validar body
    const body = await request.json();
    const validatedData = createInventorySchema.parse(body);

    // Crear inventario
    const result = await InventoryService.createInventory({
      tenantId: tenantContext.data.tenantId,
      ...validatedData,
    });

    if (!result.success) {
      return toInventoryErrorResponse(result.error);
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/inventory:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
