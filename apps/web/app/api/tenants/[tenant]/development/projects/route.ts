import { NextRequest } from "next/server";
import { auth } from "@sass-store/config/auth";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { Result, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import {
  resolvePortalTenant,
  setDevelopmentTenantContext,
} from "@/lib/tenant/development-guard";
import { DevelopmentService } from "@/lib/services/development-service";

export const GET = withResultHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ tenant: string }> },
  ): Promise<Result<unknown, DomainError>> => {
    const session = await auth();
    if (!session?.user) {
      return Err(ErrorFactories.authentication("missing_token"));
    }

    const { tenant: tenantSlug } = await context.params;
    const tenantResult = await resolvePortalTenant(tenantSlug);
    if (tenantResult.success === false) return tenantResult;
    const tenant = tenantResult.data;

    const contextResult = await setDevelopmentTenantContext(tenant.id);
    if (contextResult.success === false) return contextResult;

    return DevelopmentService.listProjects(tenant.id);
  },
);
