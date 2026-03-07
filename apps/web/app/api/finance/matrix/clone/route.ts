import { NextRequest } from "next/server";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { DomainError } from "@sass-store/core/src/errors/types";
import { Result } from "@sass-store/core/src/result";
import {
  MatrixCloneMonthSchema,
  validateWithZod,
} from "@sass-store/validation/src/zod-result";
import { financialMatrixService } from "@/lib/services/financial-matrix-service";

type MatrixCloneBody = {
  tenantId: string;
  sourceBucketId: string;
  targetBucketId: string;
  categoryIds?: string[];
};

const parseBody = async (
  request: NextRequest,
): Promise<Result<MatrixCloneBody, DomainError>> => {
  const body = await request.json();
  const validated = validateWithZod(MatrixCloneMonthSchema, body, "body");

  if (!validated.success) {
    return validated;
  }

  return validated;
};

export const POST = withResultHandler(async (request: NextRequest) => {
  const parsed = await parseBody(request);
  if (!parsed.success) {
    return parsed;
  }

  return financialMatrixService.cloneMonthPlanning(parsed.data);
});

