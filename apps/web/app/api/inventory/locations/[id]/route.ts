import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  resolveInventoryTenantContext,
  toInventoryErrorResponse,
} from "../../_lib/tenant-context";
import {
  getInventoryConfigArray,
  setInventoryConfigArray,
} from "../../_lib/config-store";
import { InventoryLocationEntity } from "../../_lib/types";

// Validation schemas
const updateInventoryLocationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  code: z.string().min(1).max(100).optional(),
  type: z.enum(["warehouse", "store", "office", "other"]).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(150).optional(),
  state: z.string().max(150).optional(),
  country: z.string().max(150).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal("")),
  manager: z.string().max(200).optional(),
  capacity: z.number().min(0).optional(),
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
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const locationId = context.params.id;

    const locationsResult = await getInventoryConfigArray<InventoryLocationEntity>(
      tenantContext.data.tenantId,
      "locations",
    );

    if (!locationsResult.success) {
      return toInventoryErrorResponse(locationsResult.error);
    }

    const location = locationsResult.data.find((loc) => loc.id === locationId);

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
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const locationId = context.params.id;

    // Parsear y validar body
    const body = await request.json();
    const validatedData = updateInventoryLocationSchema.parse(body);

    const locationsResult = await getInventoryConfigArray<InventoryLocationEntity>(
      tenantContext.data.tenantId,
      "locations",
    );

    if (!locationsResult.success) {
      return toInventoryErrorResponse(locationsResult.error);
    }

    const locationIndex = locationsResult.data.findIndex(
      (loc) => loc.id === locationId,
    );

    if (locationIndex === -1) {
      return NextResponse.json(
        { error: "Ubicación de inventario no encontrada" },
        { status: 404 },
      );
    }

    // Check for duplicate code if code is being updated
    if (validatedData.code) {
      const newCode = validatedData.code;
      const duplicatedCode = locationsResult.data.some(
        (loc) =>
          loc.id !== locationId &&
          loc.code.toLowerCase().trim() === newCode.toLowerCase().trim(),
      );

      if (duplicatedCode) {
        return NextResponse.json(
          { error: "Ya existe una ubicación con ese código" },
          { status: 409 },
        );
      }
    }

    // Update location
    const updatedLocation = {
      ...locationsResult.data[locationIndex],
      ...validatedData,
      updatedAt: new Date().toISOString(),
    };

    const updatedLocations = [...locationsResult.data];
    updatedLocations[locationIndex] = updatedLocation;

    const saveResult = await setInventoryConfigArray(
      tenantContext.data.tenantId,
      "locations",
      updatedLocations,
    );

    if (!saveResult.success) {
      return toInventoryErrorResponse(saveResult.error);
    }

    return NextResponse.json(updatedLocation);
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
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const locationId = context.params.id;

    const locationsResult = await getInventoryConfigArray<InventoryLocationEntity>(
      tenantContext.data.tenantId,
      "locations",
    );

    if (!locationsResult.success) {
      return toInventoryErrorResponse(locationsResult.error);
    }

    const locationIndex = locationsResult.data.findIndex(
      (loc) => loc.id === locationId,
    );

    if (locationIndex === -1) {
      return NextResponse.json(
        { error: "Ubicación de inventario no encontrada" },
        { status: 404 },
      );
    }

    // Remove location
    const updatedLocations = locationsResult.data.filter(
      (loc) => loc.id !== locationId,
    );

    const saveResult = await setInventoryConfigArray(
      tenantContext.data.tenantId,
      "locations",
      updatedLocations,
    );

    if (!saveResult.success) {
      return toInventoryErrorResponse(saveResult.error);
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
