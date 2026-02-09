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
import { SupplierEntity, SupplierSchema } from "../_lib/types";

const createSupplierSchema = z.object({
  name: z.string().min(1).max(200),
  contactPerson: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
});

const sortSuppliers = (suppliers: SupplierEntity[]) =>
  [...suppliers].sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));

export async function GET() {
  const tenantContext = await resolveInventoryTenantContext();
  if (!tenantContext.success) {
    return toInventoryErrorResponse(tenantContext.error);
  }

  const suppliersResult = await getInventoryConfigArray<SupplierEntity>(
    tenantContext.data.tenantId,
    "suppliers",
  );

  if (!suppliersResult.success) {
    return toInventoryErrorResponse(suppliersResult.error);
  }

  return NextResponse.json(sortSuppliers(suppliersResult.data));
}

export async function POST(request: NextRequest) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const payload = createSupplierSchema.parse(await request.json());
    const suppliersResult = await getInventoryConfigArray<SupplierEntity>(
      tenantContext.data.tenantId,
      "suppliers",
    );

    if (!suppliersResult.success) {
      return toInventoryErrorResponse(suppliersResult.error);
    }

    const now = new Date().toISOString();
    const supplier = SupplierSchema.parse({
      id: crypto.randomUUID(),
      tenantId: tenantContext.data.tenantId,
      name: payload.name,
      contactPerson: payload.contactPerson,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      metadata: payload.metadata ?? {},
    });

    const updatedSuppliers = [...suppliersResult.data, supplier];
    const saveResult = await setInventoryConfigArray(
      tenantContext.data.tenantId,
      "suppliers",
      updatedSuppliers,
    );

    if (!saveResult.success) {
      return toInventoryErrorResponse(saveResult.error);
    }

    return NextResponse.json(supplier, { status: 201 });
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

