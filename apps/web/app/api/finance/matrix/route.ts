import { NextRequest } from "next/server";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { Result } from "@sass-store/core/src/result";
import { DomainError } from "@sass-store/core/src/errors/types";
import {
  MatrixLoadQuerySchema,
  validateWithZod,
} from "@sass-store/validation/src/zod-result";
import { financialMatrixService } from "@/lib/services/financial-matrix-service";

const parseQueryParams = (
  request: NextRequest,
): Result<
  {
    tenantId: string;
    granularity: "week" | "fortnight" | "month" | "year";
    startDate: Date;
    endDate: Date;
    entityId?: string;
  },
  DomainError
> => {
  const { searchParams } = new URL(request.url);

  const raw = {
    tenantId: searchParams.get("tenantId"),
    granularity: searchParams.get("granularity"),
    startDate: searchParams.get("startDate"),
    endDate: searchParams.get("endDate"),
    entityId: searchParams.get("entityId") ?? undefined,
  };

  const validated = validateWithZod(MatrixLoadQuerySchema, raw, "query");
  if (!validated.success) {
    return validated;
  }

  return validated;
};

export const GET = withResultHandler(async (request: NextRequest) => {
  const queryResult = parseQueryParams(request);
  if (!queryResult.success) {
    return queryResult;
  }

  const data = queryResult.data;
  return financialMatrixService.getMatrixData({
    tenantId: data.tenantId,
    granularity: data.granularity,
    startDate: data.startDate,
    endDate: data.endDate,
    entityId: data.entityId,
  });
});

