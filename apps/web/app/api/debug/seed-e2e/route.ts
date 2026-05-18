import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import {
  products,
  tenants,
  users,
  userRoles,
  transactionCategories,
  budgets,
  customers,
} from "@sass-store/database/schema";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const SLUG_RE = /^[a-z0-9-]{1,64}$/;

const TEST_USER = {
  id: "e2e-test-user-001",
  name: "E2E Admin",
  email: "jagzao@gmail.com",
  password: "admin",
};

/**
 * POST /api/debug/seed-e2e
 * Endpoint de semilla usado por Playwright (STRY-001 y POS).
 * Solo disponible en desarrollo y test.
 */
export async function POST(request: NextRequest) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 },
    );
  }

  let tenantSlug = "wondernails";
  try {
    const body = (await request.json().catch(() => null)) as {
      tenantSlug?: string;
    } | null;
    const raw = body?.tenantSlug?.trim().toLowerCase();
    if (raw && SLUG_RE.test(raw)) {
      tenantSlug = raw;
    }
  } catch {
    /* use default */
  }

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // 1. Upsert standard test user
  const hashedPassword = await bcrypt.hash(TEST_USER.password, 10);
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, TEST_USER.email))
    .limit(1);

  const userId = existingUser ? existingUser.id : TEST_USER.id;

  if (!existingUser) {
    await db.insert(users).values({
      id: TEST_USER.id,
      name: TEST_USER.name,
      email: TEST_USER.email,
      password: hashedPassword,
      emailVerified: new Date(),
    });
  } else {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, TEST_USER.email));
  }

  // 2. Assign admin role — delete any existing record then re-insert
  // (avoids RLS filtering issues and duplicate row problems)
  await db
    .delete(userRoles)
    .where(
      and(eq(userRoles.userId, userId), eq(userRoles.tenantId, tenant.id)),
    );
  await db
    .insert(userRoles)
    .values({ userId, tenantId: tenant.id, role: "Admin" });

  // 3. Seed product if none exists
  const existingProduct = await db
    .select()
    .from(products)
    .where(eq(products.tenantId, tenant.id))
    .limit(1);

  if (existingProduct.length === 0) {
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
  }

  // 4. Seed finance categories and budget if none exist
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

  // 5. Seed at least one customer for tenant isolation tests
  const existingCustomers = await db
    .select()
    .from(customers)
    .where(eq(customers.tenantId, tenant.id))
    .limit(1);

  if (existingCustomers.length === 0) {
    await db.insert(customers).values({
      tenantId: tenant.id,
      name: "Cliente E2E Test",
      phone: "5551234567",
      email: "e2e-customer@test.com",
      status: "active",
    });
  }

  return NextResponse.json({
    message: "E2E seed completed",
    tenant: tenantSlug,
    user: TEST_USER.email,
    productSeeded: existingProduct.length === 0,
    financeSeeded: existingCats.length === 0,
    budgetSeeded: existingBudgets.length === 0,
    customerSeeded: existingCustomers.length === 0,
  });
}
