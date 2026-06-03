import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import { isSportsTenant } from "@/lib/tenant/client-terminology";
import { Result, Ok, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

export type ResolvedSportsTenant = {
  id: string;
  slug: string;
  name: string;
};

export async function resolveSportsTenant(
  tenantSlug: string,
): Promise<Result<ResolvedSportsTenant, DomainError>> {
  if (!isSportsTenant(tenantSlug)) {
    return Err(
      ErrorFactories.notFound("SportsSessionsModule", `tenant:${tenantSlug}`),
    );
  }

  const [tenant] = await db
    .select({ id: tenants.id, slug: tenants.slug, name: tenants.name })
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenant) {
    return Err(ErrorFactories.notFound("Tenant", tenantSlug));
  }

  return Ok(tenant);
}
