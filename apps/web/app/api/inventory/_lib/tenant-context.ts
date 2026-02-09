import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, eq, sql } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import { Result, Ok, Err, fromPromise } from "@sass-store/core/src/result";
import {
  DomainError,
  ErrorFactories,
  getHttpStatusCode,
} from "@sass-store/core/src/errors/types";

export interface InventoryTenantContext {
  tenantId: string;
  tenantSlug: string;
  userId: string | null;
}

export const resolveInventoryTenantContext = async (): Promise<
  Result<InventoryTenantContext, DomainError>
> => {
  const session = await auth();

  if (!session?.user) {
    return Err(ErrorFactories.authentication("missing_token", "No autorizado"));
  }

  const tenantSlug = session.user.tenantSlug;
  if (!tenantSlug) {
    return Err(
      ErrorFactories.tenant(
        "resolve_inventory_tenant",
        "Tenant no encontrado en la sesión",
      ),
    );
  }

  const tenantResult = await fromPromise(
    db.select({ id: tenants.id, slug: tenants.slug })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1),
    (error) =>
      ErrorFactories.database(
        "resolve_inventory_tenant",
        `Failed to resolve tenant ${tenantSlug}`,
        undefined,
        error as Error,
      ),
  );

  if (!tenantResult.success) {
    return Err(tenantResult.error);
  }

  const tenant = tenantResult.data[0];
  if (!tenant) {
    return Err(ErrorFactories.notFound("Tenant", tenantSlug));
  }

  const contextResult = await fromPromise(
    db.execute(sql`SELECT set_tenant_context(${tenant.id}::uuid)`),
    (error) =>
      ErrorFactories.database(
        "set_tenant_context",
        "Failed to set tenant context",
        undefined,
        error as Error,
      ),
  );

  if (!contextResult.success) {
    return Err(contextResult.error);
  }

  return Ok({
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    userId: session.user.id ?? null,
  });
};

export const toInventoryErrorResponse = (error: DomainError) =>
  NextResponse.json(
    {
      error: error.message,
      type: error.type,
      details: error.details,
    },
    { status: getHttpStatusCode(error) },
  );

