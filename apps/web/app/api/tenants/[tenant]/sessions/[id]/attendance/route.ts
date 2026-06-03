import { NextRequest } from "next/server";
import { auth } from "@sass-store/config/auth";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { Result, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { validateWithZod } from "@sass-store/validation/src/zod-result";
import { z } from "zod";
import { ClassSessionService } from "@/lib/services/class-session-service";
import { resolveSportsTenant } from "@/lib/tenant/sports-session-guard";

const attendanceSchema = z.object({
  updates: z
    .array(
      z.object({
        enrollmentId: z.string().uuid(),
        present: z.boolean(),
      }),
    )
    .min(1),
});

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
    const validated = validateWithZod(attendanceSchema, body);
    if (validated.success === false) return validated;

    return ClassSessionService.markAttendance(
      tenantResult.data.id,
      id,
      validated.data.updates,
      session.user.id,
    );
  },
);
