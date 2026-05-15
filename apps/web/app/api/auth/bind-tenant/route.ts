import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@sass-store/database";
import { tenants, userRoles } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const bodySchema = z.object({ tenantSlug: z.string().min(1) });

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "tenantSlug required" }, { status: 400 });
  }

  const { tenantSlug } = parsed.data;

  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const [existing] = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, session.user.id),
        eq(userRoles.tenantId, tenant.id),
      ),
    )
    .limit(1);

  if (!existing) {
    try {
      await db
        .insert(userRoles)
        .values({
          userId: session.user.id,
          tenantId: tenant.id,
          role: "Cliente",
          updatedAt: new Date(),
        })
        .onConflictDoNothing();
    } catch {
      // ignore duplicate key — race condition safe
    }
  }

  return NextResponse.json({
    tenantSlug,
    role: existing?.role ?? "Cliente",
    isNewUser: !existing, // first time this Google user binds to this tenant
  });
}
