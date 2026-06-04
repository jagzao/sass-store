import { NextRequest } from "next/server";
import { auth } from "@sass-store/config/auth";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { Result, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { validateWithZod } from "@sass-store/validation/src/zod-result";
import { z } from "zod";
import { ClassSessionService } from "@/lib/services/class-session-service";
import { resolveSportsTenant } from "@/lib/tenant/sports-session-guard";

const createSessionSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  maxCapacity: z.number().int().min(1).max(100),
  staffId: z.string().uuid().optional(),
  location: z.string().max(255).optional(),
});

export const GET = withResultHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ tenant: string }> },
  ): Promise<Result<unknown, DomainError>> => {
    const { tenant: tenantSlug } = await context.params;
    const tenantResult = await resolveSportsTenant(tenantSlug);
    if (tenantResult.success === false) return tenantResult;
    const tenant = tenantResult.data;

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const date = searchParams.get("date");

    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    if (date === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      fromDate = start;
      toDate = end;
    } else {
      if (from) fromDate = new Date(from);
      if (to) toDate = new Date(to);
    }

    const status = searchParams.get("status") as
      | "scheduled"
      | "cancelled"
      | "completed"
      | null;

    return ClassSessionService.listSessions(tenant.id, {
      from: fromDate,
      to: toDate,
      status: status ?? undefined,
    });
  },
);

export const POST = withResultHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ tenant: string }> },
  ): Promise<Result<unknown, DomainError>> => {
    const session = await auth();
    if (!session?.user) {
      return Err(ErrorFactories.authorization("Sesión requerida"));
    }

    const { tenant: tenantSlug } = await context.params;
    const tenantResult = await resolveSportsTenant(tenantSlug);
    if (tenantResult.success === false) return tenantResult;
    const tenant = tenantResult.data;

    const body = await request.json();
    const validated = validateWithZod(createSessionSchema, body);
    if (validated.success === false) return validated;

    const data = validated.data;
    return ClassSessionService.createSession(tenant.id, {
      title: data.title,
      description: data.description,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      maxCapacity: data.maxCapacity,
      staffId: data.staffId,
      location: data.location,
    });
  },
);
