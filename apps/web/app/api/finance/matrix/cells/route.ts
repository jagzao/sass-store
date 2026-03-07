import { NextRequest } from "next/server";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { DomainError } from "@sass-store/core/src/errors/types";
import { Result } from "@sass-store/core/src/result";
import {
  MatrixUpsertCellSchema,
  validateWithZod,
} from "@sass-store/validation/src/zod-result";
import { financialMatrixService } from "@/lib/services/financial-matrix-service";

type MatrixUpsertBody = {
  tenantId: string;
  categoryId: string;
  granularity: "week" | "fortnight" | "month" | "year";
  bucketId?: string;
  bucketStartDate: Date;
  bucketEndDate: Date;
  projectedAmount: string | number;
  entityId?: string;
  notes?: string;
};

const parseBody = async (
  request: NextRequest,
): Promise<Result<MatrixUpsertBody, DomainError>> => {
  const body = await request.json();
  const validated = validateWithZod(MatrixUpsertCellSchema, body, "body");

  if (!validated.success) {
    return validated;
  }

  return validated;
};

export const PUT = withResultHandler(async (request: NextRequest) => {
  const parsed = await parseBody(request);
  if (!parsed.success) {
    return parsed;
  }

  return financialMatrixService.upsertProjectedCell({
    ...parsed.data,
    projectedAmount: String(parsed.data.projectedAmount),
  });
});

export const PATCH = PUT;

