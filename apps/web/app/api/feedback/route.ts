import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { Result, Ok, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { validateWithZod } from "@sass-store/validation/src/zod-result";
import {
  CreateFeedbackSchema,
  ListFeedbackQuerySchema,
} from "@sass-store/validation/src/feedback";
import {
  submitFeedback,
  listFeedbackByTenant,
} from "@/lib/services/feedback-service";
import { getTenantIdForRequest } from "@/lib/tenant/resolver";
import { AdvancedRateLimiter } from "@/lib/security/rate-limiter";

const feedbackRateLimiter = new AdvancedRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 3,
  identifier: "feedback",
});

const parseListQuery = (
  request: NextRequest,
): Result<
  {
    tenantId: string;
    category?: "opinion" | "sugerencia" | "problema";
    status?: "pending" | "sent" | "failed" | "retrying";
    page: number;
    limit: number;
  },
  DomainError
> => {
  const { searchParams } = new URL(request.url);
  const raw = {
    tenantId: searchParams.get("tenantId") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    page: searchParams.get("page") ?? "1",
    limit: searchParams.get("limit") ?? "20",
  };

  const validated = validateWithZod(ListFeedbackQuerySchema, raw, "query");
  if (!validated.success) {
    return validated;
  }

  const data = validated.data;
  return Ok({
    tenantId: data.tenantId ?? "",
    category: data.category,
    status: data.status,
    page: data.page ?? 1,
    limit: data.limit ?? 20,
  });
};

export const POST = withResultHandler(async (request: NextRequest) => {
  const rateResult = await feedbackRateLimiter.checkLimit(request, "feedback");

  if (!rateResult.allowed) {
    return Err(
      ErrorFactories.rateLimit(
        3,
        "15m",
        Math.ceil((rateResult.resetTime - Date.now()) / 1000),
      ),
    );
  }

  const tenantId = await getTenantIdForRequest(request);

  const bodyResult = await (async () => {
    try {
      const body = await request.json();
      return validateWithZod(CreateFeedbackSchema, body);
    } catch (error) {
      return Err(
        ErrorFactories.validation(
          "Failed to parse request body",
          undefined,
          undefined,
          error,
        ),
      );
    }
  })();

  if (!bodyResult.success) {
    return bodyResult;
  }

  const session = await auth();

  const result = await submitFeedback({
    ...bodyResult.data,
    tenantId,
    userId: session?.user?.id,
    context: {
      route: bodyResult.data.route,
      ...bodyResult.data.context,
    },
  });

  return result;
});

export const GET = withResultHandler(async (request: NextRequest) => {
  const session = await auth();

  if (!session?.user?.id) {
    return Err(ErrorFactories.authentication("missing_token"));
  }

  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return Err(
      ErrorFactories.validation("tenant context is required", "tenantId"),
    );
  }

  const queryResult = parseListQuery(request);
  if (!queryResult.success) {
    return queryResult;
  }

  const query = queryResult.data;

  return listFeedbackByTenant({
    ...query,
    tenantId,
  });
});
