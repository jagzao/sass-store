import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { products, tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/debug/seed-e2e
 * Endpoint de semilla usado solo por Playwright globalSetup.
 * Verifica que el tenant wondernails tenga al menos 1 producto para E2E de POS.
 */
export async function POST(request: NextRequest) {
  const tenantSlug = "wondernails";

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const existing = await db
    .select()
    .from(products)
    .where(eq(products.tenantId, tenant.id))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ message: "Seed skipped: products already exist" });
  }

  await db.insert(products).values([
    {
      tenantId: tenant.id,
      sku: "E2E-PROD-001",
      name: "Producto E2E Test",
      description: "Creado automáticamente por globalSetup de Playwright",
      price: "99.99",
      category: "general",
      active: true,
      isSupply: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  return NextResponse.json({
    message: "Seeded 1 product for E2E",
    tenant: tenantSlug,
  });
}
