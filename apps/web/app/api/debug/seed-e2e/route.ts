import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import {
  products,
  tenants,
  users,
  userRoles,
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
 * Body opcional: `{ "tenantSlug": "wondernails" | "centro-tenistico" | ... }`
 * Garantiza:
 * - Al menos 1 producto activo para E2E de POS en ese tenant.
 * - Usuario de prueba estándar `jagzao@gmail.com` / `admin` con rol admin.
 */
export async function POST(request: NextRequest) {
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

  // 2. Assign admin role for tenant
  const [existingRole] = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.tenantId, tenant.id)))
    .limit(1);

  if (!existingRole) {
    await db.insert(userRoles).values({
      userId,
      tenantId: tenant.id,
      role: "Admin",
    });
  }

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

  return NextResponse.json({
    message: "E2E seed completed",
    tenant: tenantSlug,
    user: TEST_USER.email,
    productSeeded: existingProduct.length === 0,
  });
}
