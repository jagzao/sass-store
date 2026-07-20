import { NextRequest } from "next/server";
import { auth } from "@sass-store/config/auth";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { Result, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { z } from "zod";
import { validateWithZod } from "@sass-store/validation/src/zod-result";
import {
  resolvePortalTenant,
  setDevelopmentTenantContext,
} from "@/lib/tenant/development-guard";
import { DevelopmentService } from "@/lib/services/development-service";

const dailyQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  date: z.string().date().optional(),
  generate: z.enum(["true", "false"]).optional().default("false"),
});

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

    const { searchParams } = new URL(request.url);
    const query = validateWithZod(dailyQuerySchema, {
      projectId: searchParams.get("projectId") || undefined,
      date: searchParams.get("date") || undefined,
      generate: searchParams.get("generate") || "false",
    });
    if (query.success === false) return query;

    const { projectId, date, generate } = query.data;

    if (generate === "true" && projectId && date) {
      return DevelopmentService.generateDailyReport(
        tenant.id,
        projectId,
        new Date(date),
      );
    }

    return DevelopmentService.listDailyReports(tenant.id, projectId, 30);
  },
);
