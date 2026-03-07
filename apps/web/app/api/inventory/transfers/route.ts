import { NextRequest, NextResponse } from "next/server";
import { InventoryService } from "@/lib/inventory/inventory-service";
import { z } from "zod";
import {
  resolveInventoryTenantContext,
  toInventoryErrorResponse,
} from "../_lib/tenant-context";

// Validation schemas
const querySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default("20"),
  productId: z.string().uuid().optional(),
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled"])
    .optional(),
});

const createTransferSchema = z.object({
  productId: z.string().uuid(),
  fromLocationId: z
    .string()
    .min(1, "El ID de la ubicación de origen es requerido"),
  toLocationId: z
    .string()
    .min(1, "El ID de la ubicación de destino es requerido"),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
  reason: z
    .string()
    .min(1, "La razón es requerida")
    .max(100, "La razón no puede exceder 100 caracteres"),
  notes: z
    .string()
    .max(500, "Las notas no pueden exceder 500 caracteres")
    .optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/inventory/transfers - Obtener todas las transferencias de inventario
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

    // Get inventory transfers
    const result = await InventoryService.getInventoryTransfers({
      tenantId: tenantContext.data.tenantId,
      ...query,
    });

    if (!result.success) {
      return toInventoryErrorResponse(result.error);
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error en GET /api/inventory/transfers:", error);

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
 * POST /api/inventory/transfers - Crear una nueva transferencia de inventario
 */
export async function POST(request: NextRequest) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    // Parse and validate body
    const body = await request.json();
    const validatedData = createTransferSchema.parse(body);

    // Create inventory transfer
    const result = await InventoryService.createInventoryTransfer({
      tenantId: tenantContext.data.tenantId,
      ...validatedData,
    });

    if (!result.success) {
      return toInventoryErrorResponse(result.error);
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/inventory/transfers:", error);

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
