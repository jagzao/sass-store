import { NextRequest } from "next/server";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { Result, Ok } from "@sass-store/core/src/result";
import { DomainError } from "@sass-store/core/src/errors/types";
import { validateWithZod } from "@sass-store/validation/src/zod-result";
import { z } from "zod";
import { ClassSessionService } from "@/lib/services/class-session-service";
import { resolveSportsTenant } from "@/lib/tenant/sports-session-guard";

const enrollSchema = z.object({
  customerName: z.string().min(1).max(200),
  customerPhone: z.string().min(10).max(20),
  customerEmail: z.string().email().optional().or(z.literal("")),
});

export const GET = withResultHandler(
  async (
    _request: NextRequest,
    context: { params: Promise<{ tenant: string; id: string }> },
  ): Promise<Result<unknown, DomainError>> => {
    const { tenant: tenantSlug, id } = await context.params;
    const tenantResult = await resolveSportsTenant(tenantSlug);
    if (tenantResult.success === false) return tenantResult;
    const sessionResult = await ClassSessionService.getSession(
      tenantResult.data.id,
      id,
    );
    if (sessionResult.success === false) return sessionResult;
    return Ok({ enrollments: sessionResult.data.enrollments ?? [] });
  },
);

export const POST = withResultHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ tenant: string; id: string }> },
  ): Promise<Result<unknown, DomainError>> => {
    const { tenant: tenantSlug, id } = await context.params;
    const tenantResult = await resolveSportsTenant(tenantSlug);
    if (tenantResult.success === false) return tenantResult;
    const tenant = tenantResult.data;

    const body = await request.json();
    const validated = validateWithZod(enrollSchema, body);
    if (validated.success === false) return validated;

    const data = validated.data;
    return ClassSessionService.enrollStudent(
      tenant.id,
      tenant.slug,
      tenant.name,
      id,
      {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || undefined,
      },
    );
  },
);
