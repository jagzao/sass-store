import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  resolveInventoryTenantContext,
  toInventoryErrorResponse,
} from "../_lib/tenant-context";
import {
  getInventoryConfigArray,
  setInventoryConfigArray,
} from "../_lib/config-store";
import {
  InventoryLocationEntity,
  InventoryLocationSchema,
} from "../_lib/types";

const querySchema = z.object({
  type: z.enum(["warehouse", "store", "office", "other"]).optional(),
  isActive: z
    .string()
    .transform((value) => value === "true")
    .optional(),
});

const createLocationSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(100),
  type: z.enum(["warehouse", "store", "office", "other"]),
  address: z.string().max(500).optional(),
  city: z.string().max(150).optional(),
  state: z.string().max(150).optional(),
  country: z.string().max(150).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  manager: z.string().max(200).optional(),
  capacity: z.number().min(0).optional(),
  isActive: z.boolean().optional().default(true),
  metadata: z.record(z.any()).optional(),
});

const sortLocations = (locations: InventoryLocationEntity[]) =>
  [...locations].sort((a, b) =>
    a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
  );

export async function GET(request: NextRequest) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const query = querySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    const locationsResult = await getInventoryConfigArray<InventoryLocationEntity>(
      tenantContext.data.tenantId,
      "locations",
    );

    if (!locationsResult.success) {
      return toInventoryErrorResponse(locationsResult.error);
    }

    const filtered = locationsResult.data.filter((location) => {
      if (query.type && location.type !== query.type) {
        return false;
      }

      if (
        query.isActive !== undefined &&
        Boolean(location.isActive) !== query.isActive
      ) {
        return false;
      }

      return true;
    });

    return NextResponse.json(sortLocations(filtered));
  } catch (error) {
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

export async function POST(request: NextRequest) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const payload = createLocationSchema.parse(await request.json());

    const locationsResult = await getInventoryConfigArray<InventoryLocationEntity>(
      tenantContext.data.tenantId,
      "locations",
    );

    if (!locationsResult.success) {
      return toInventoryErrorResponse(locationsResult.error);
    }

    const duplicatedCode = locationsResult.data.some(
      (location) =>
        location.code.toLowerCase().trim() === payload.code.toLowerCase().trim(),
    );

    if (duplicatedCode) {
      return NextResponse.json(
        { error: "Ya existe una ubicación con ese código" },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const location = InventoryLocationSchema.parse({
      id: crypto.randomUUID(),
      tenantId: tenantContext.data.tenantId,
      name: payload.name,
      code: payload.code,
      type: payload.type,
      address: payload.address,
      city: payload.city,
      state: payload.state,
      country: payload.country,
      phone: payload.phone,
      email: payload.email,
      manager: payload.manager,
      capacity: payload.capacity,
      isActive: payload.isActive,
      createdAt: now,
      updatedAt: now,
      metadata: payload.metadata ?? {},
    });

    const updatedLocations = [...locationsResult.data, location];
    const saveResult = await setInventoryConfigArray(
      tenantContext.data.tenantId,
      "locations",
      updatedLocations,
    );

    if (!saveResult.success) {
      return toInventoryErrorResponse(saveResult.error);
    }

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
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

