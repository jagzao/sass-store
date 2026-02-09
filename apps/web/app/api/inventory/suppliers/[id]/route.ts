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
import { SupplierEntity, SupplierSchema } from "../../_lib/types";

const updateSupplierSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  contactPerson: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

const findSupplierById = (suppliers: SupplierEntity[], id: string) =>
  suppliers.find((supplier) => supplier.id === id);

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const tenantContext = await resolveInventoryTenantContext();
  if (!tenantContext.success) {
    return toInventoryErrorResponse(tenantContext.error);
  }

  const { id } = await params;
  const suppliersResult = await getInventoryConfigArray<SupplierEntity>(
    tenantContext.data.tenantId,
    "suppliers",
  );

  if (!suppliersResult.success) {
    return toInventoryErrorResponse(suppliersResult.error);
  }

  const supplier = findSupplierById(suppliersResult.data, id);
  if (!supplier) {
    return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });
  }

  return NextResponse.json(supplier);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantContext = await resolveInventoryTenantContext();
    if (!tenantContext.success) {
      return toInventoryErrorResponse(tenantContext.error);
    }

    const { id } = await params;
    const payload = updateSupplierSchema.parse(await request.json());

    const suppliersResult = await getInventoryConfigArray<SupplierEntity>(
      tenantContext.data.tenantId,
      "suppliers",
    );

    if (!suppliersResult.success) {
      return toInventoryErrorResponse(suppliersResult.error);
    }

    const existing = findSupplierById(suppliersResult.data, id);
    if (!existing) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });
    }

    const updated = SupplierSchema.parse({
      ...existing,
      ...payload,
      updatedAt: new Date().toISOString(),
      metadata: payload.metadata ?? existing.metadata ?? {},
    });

    const updatedSuppliers = suppliersResult.data.map((supplier) =>
      supplier.id === id ? updated : supplier,
    );

    const saveResult = await setInventoryConfigArray(
      tenantContext.data.tenantId,
      "suppliers",
      updatedSuppliers,
    );

    if (!saveResult.success) {
      return toInventoryErrorResponse(saveResult.error);
    }

    return NextResponse.json(updated);
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

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const tenantContext = await resolveInventoryTenantContext();
  if (!tenantContext.success) {
    return toInventoryErrorResponse(tenantContext.error);
  }

  const { id } = await params;
  const suppliersResult = await getInventoryConfigArray<SupplierEntity>(
    tenantContext.data.tenantId,
    "suppliers",
  );

  if (!suppliersResult.success) {
    return toInventoryErrorResponse(suppliersResult.error);
  }

  const exists = suppliersResult.data.some((supplier) => supplier.id === id);
  if (!exists) {
    return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });
  }

  const updatedSuppliers = suppliersResult.data.filter(
    (supplier) => supplier.id !== id,
  );

  const saveResult = await setInventoryConfigArray(
    tenantContext.data.tenantId,
    "suppliers",
    updatedSuppliers,
  );

  if (!saveResult.success) {
    return toInventoryErrorResponse(saveResult.error);
  }

  return NextResponse.json({ success: true });
}

