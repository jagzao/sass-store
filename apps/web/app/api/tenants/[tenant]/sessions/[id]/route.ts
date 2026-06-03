import { NextRequest } from "next/server";
import { auth } from "@sass-store/config/auth";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { Result, Ok, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { validateWithZod } from "@sass-store/validation/src/zod-result";
import { z } from "zod";
import { ClassSessionService } from "@/lib/services/class-session-service";
import { resolveSportsTenant } from "@/lib/tenant/sports-session-guard";

const updateSessionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  maxCapacity: z.number().int().min(1).max(100).optional(),
  staffId: z.string().uuid().nullable().optional(),
  location: z.string().max(255).optional(),
  status: z.enum(["scheduled", "cancelled", "completed"]).optional(),
});

export const GET = withResultHandler(
  async (
    _request: NextRequest,
    context: { params: Promise<{ tenant: string; id: string }> },
  ): Promise<Result<unknown, DomainError>> => {
    const { tenant: tenantSlug, id } = await context.params;
    const tenantResult = await resolveSportsTenant(tenantSlug);
    if (tenantResult.success === false) return tenantResult;
    return ClassSessionService.getSession(tenantResult.data.id, id);
  },
);

export const PATCH = withResultHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ tenant: string; id: string }> },
  ): Promise<Result<unknown, DomainError>> => {
    const session = await auth();
    if (!session?.user) {
      return Err(ErrorFactories.authorization("Sesión requerida"));
    }

    const { tenant: tenantSlug, id } = await context.params;
    const tenantResult = await resolveSportsTenant(tenantSlug);
    if (tenantResult.success === false) return tenantResult;

    const body = await request.json();
    const validated = validateWithZod(updateSessionSchema, body);
    if (validated.success === false) return validated;

    const data = validated.data;
    return ClassSessionService.updateSession(tenantResult.data.id, id, {
      title: data.title,
      description: data.description,
      startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
      endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
      maxCapacity: data.maxCapacity,
      staffId: data.staffId ?? undefined,
      location: data.location,
      status: data.status,
    });
  },
);

export const DELETE = withResultHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ tenant: string; id: string }> },
  ): Promise<Result<unknown, DomainError>> => {
    const session = await auth();
    if (!session?.user) {
      return Err(ErrorFactories.authorization("Sesión requerida"));
    }

    const { tenant: tenantSlug, id } = await context.params;
    const tenantResult = await resolveSportsTenant(tenantSlug);
    if (tenantResult.success === false) return tenantResult;

    const force = new URL(request.url).searchParams.get("force") === "true";

    const result = await ClassSessionService.deleteSession(
      tenantResult.data.id,
      id,
      force,
    );
    if (result.success) {
      return Ok({ success: true, deleted: true });
    }
    return result;
  },
);
