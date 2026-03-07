import { NextRequest, NextResponse } from "next/server";
import { resolveTenant } from "@/lib/tenant/resolver";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { RetouchMonitorService } from "@/lib/home/retouch-monitor-service";
import { Result, Ok, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

export const GET = withResultHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ tenant: string }> }
  ): Promise<Result<any, DomainError>> => {
    try {
      // 1. Resolve Tenant from Next.js 15 params promise
      const resolvedParams = await context.params;
      const tenant = await resolveTenant(resolvedParams.tenant);
      
      if (!tenant) {
        return Err(ErrorFactories.notFound("Tenant", resolvedParams.tenant));
      }

      // 2. Execute logic keeping it isolated
      const result = await RetouchMonitorService.getPendingRetouches(tenant.id);
      
      // withResultHandler will automatically match Ok/Err and output standard JSON
      return result;
      
    } catch (error) {
       return Err(
        ErrorFactories.database(
          "get_retouches_api_error",
          "Fallo crítico en el endpoint de retouches.",
          undefined,
          error instanceof Error ? error : new Error(String(error))
        )
      );
    }
  }
);
// Force turbopack revalidation
