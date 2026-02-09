import { NextRequest, NextResponse } from "next/server";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";
import {
  resolveInventoryTenantContext,
  toInventoryErrorResponse,
} from "../_lib/tenant-context";

// Esquemas de validación
const querySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default("20"),
  productId: z.string().uuid().optional(),
  type: z.enum(["low_stock", "out_of_stock", "reorder_point"]).optional(),
  resolved: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

const bodySchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(["low_stock", "out_of_stock", "reorder_point"]),
  message: z.string().min(1).max(500),
  resolved: z.boolean().optional().default(false),
});

/**
 * GET /api/inventory/alerts - Obtener alertas de inventario
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

    // Obtener alertas
    const result = await InventoryService.getInventoryAlerts({
      tenantId: tenantContext.data.tenantId,
      ...query,
    });

    if (!result.success) {
      return toInventoryErrorResponse(result.error);
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error en GET /api/inventory/alerts:", error);

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
 * POST /api/inventory/alerts - Crear alerta de inventario
 */
export async function POST(request: NextRequest) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    // Parsear y validar body
    const body = await request.json();
    const validatedData = bodySchema.parse(body);

    // Crear alerta
    const result = await InventoryService.createInventoryAlert({
      tenantId: tenantContext.data.tenantId,
      ...validatedData,
    });

    if (!result.success) {
      return toInventoryErrorResponse(result.error);
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/inventory/alerts:", error);

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
