import { NextResponse } from "next/server";
import { db } from "@sass-store/database";
import {
  transactionCategories,
  budgets,
  tenants,
} from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/finance/seed
 * Seed de categorias de transaccion y presupuestos para E2E.
 * Solo disponible en desarrollo y test.
 */
export async function POST(request: Request) {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 },
    );
  }

  const { tenantSlug } = (await request.json().catch(() => ({}))) as {
    tenantSlug?: string;
  };

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenantSlug required" }, { status: 400 });
  }

  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Seed default categories if none exist
  const existingCats = await db
    .select()
    .from(transactionCategories)
    .where(eq(transactionCategories.tenantId, tenant.id))
    .limit(1);

  if (existingCats.length === 0) {
    await db.insert(transactionCategories).values([
      {
        tenantId: tenant.id,
        type: "income",
        name: "Ventas",
        color: "#10B981",
        isDefault: true,
      },
      {
        tenantId: tenant.id,
        type: "income",
        name: "Servicios",
        color: "#3B82F6",
      },
      {
        tenantId: tenant.id,
        type: "expense",
        name: "Insumos",
        color: "#EF4444",
        isDefault: true,
      },
      {
        tenantId: tenant.id,
        type: "expense",
        name: "Sueldos",
        color: "#F59E0B",
      },
    ]);
  }

  // Seed default budget if none exist
  const existingBudgets = await db
    .select()
    .from(budgets)
    .where(eq(budgets.tenantId, tenant.id))
    .limit(1);

  if (existingBudgets.length === 0) {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    await db.insert(budgets).values({
      tenantId: tenant.id,
      name: "Presupuesto Mensual E2E",
      periodType: "monthly",
      startDate: now.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      totalLimit: "50000.00",
      status: "active",
    });
  }

  return NextResponse.json({
    message: "Finance seed completed",
    categoriesSeeded: existingCats.length === 0,
    budgetSeeded: existingBudgets.length === 0,
  });
}
