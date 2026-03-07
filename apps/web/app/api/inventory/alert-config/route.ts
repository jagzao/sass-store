import { NextRequest, NextResponse } from "next/server";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";
import {
  resolveInventoryTenantContext,
  toInventoryErrorResponse,
} from "../_lib/tenant-context";

// Validation schemas
const querySchema = z.object({
  productId: z.string().uuid().optional(),
  isActive: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default("20"),
});

const createAlertConfigSchema = z.object({
  productId: z.string().uuid(),
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
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = querySchema.parse(Object.fromEntries(searchParams));

    // Get alert configurations
    const result = await InventoryService.getInventoryAlertConfigs({
      tenantId: tenantContext.data.tenantId,
      ...query,
    });

    if (!result.success) {
      return toInventoryErrorResponse(result.error);
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error en GET /api/inventory/alert-config:", error);

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
 * POST /api/inventory/alert-config - Crear una nueva configuración de alerta de inventario
 */
export async function POST(request: NextRequest) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    // Parse and validate body
    const body = await request.json();
    const validatedData = createAlertConfigSchema.parse(body);

    // Create alert configuration
    const result = await InventoryService.createInventoryAlertConfig({
      tenantId: tenantContext.data.tenantId,
      ...validatedData,
    });

    if (!result.success) {
      return toInventoryErrorResponse(result.error);
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/inventory/alert-config:", error);

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
