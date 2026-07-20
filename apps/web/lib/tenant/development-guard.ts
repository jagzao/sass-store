import { db } from "@sass-store/database";
import { tenants, tenantConfigs } from "@sass-store/database/schema";
import { eq, and, sql } from "drizzle-orm";
import { Result, Ok, Err, fromPromise } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

export type ResolvedDevelopmentTenant = {
  id: string;
  slug: string;
  name: string;
  businessType: string | null;
};

export const SUPPORTED_PORTAL_BUSINESS_TYPES = [
  "development",
  "salud y belleza",
];

async function getTenantBusinessType(tenantId: string): Promise<string | null> {
  const configResult = await db
    .select({ value: tenantConfigs.value })
    .from(tenantConfigs)
    .where(
      and(
        eq(tenantConfigs.tenantId, tenantId),
        eq(tenantConfigs.category, "business"),
        eq(tenantConfigs.key, "type"),
      ),
    )
    .limit(1);

  const value = configResult[0]?.value;
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  return (value as { value?: unknown }).value as string | null;
}

export async function resolvePortalTenant(
  tenantSlug: string,
): Promise<Result<ResolvedDevelopmentTenant, DomainError>> {
  const tenantResult = await db
    .select({ id: tenants.id, slug: tenants.slug, name: tenants.name })
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  const tenant = tenantResult[0];
  if (!tenant) {
    return Err(ErrorFactories.notFound("Tenant", tenantSlug));
  }

  const businessType = await getTenantBusinessType(tenant.id);

  if (
    !businessType ||
    !SUPPORTED_PORTAL_BUSINESS_TYPES.includes(businessType)
  ) {
    return Err(
      ErrorFactories.authorization(
        "El portal no está disponible para este tipo de negocio",
        "portal_business_type",
        tenant.id,
      ),
    );
  }

  return Ok({ ...tenant, businessType });
}

export async function setDevelopmentTenantContext(
  tenantId: string,
): Promise<Result<void, DomainError>> {
  return fromPromise(
    db.execute(sql`SELECT set_tenant_context(${tenantId}::uuid)`),
    () =>
      ErrorFactories.tenant(
        "set_tenant_context",
        "Error al establecer contexto de tenant",
        tenantId,
      ),
  ).then((result) => (result.success ? Ok(undefined) : result));
}
