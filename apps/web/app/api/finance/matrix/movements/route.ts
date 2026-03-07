import { NextRequest } from "next/server";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { DomainError } from "@sass-store/core/src/errors/types";
import { Result } from "@sass-store/core/src/result";
import {
  MatrixMarkPaidSchema,
  validateWithZod,
} from "@sass-store/validation/src/zod-result";
import { financialMatrixService } from "@/lib/services/financial-matrix-service";

type MatrixMarkPaidBody = {
  tenantId: string;
  categoryId: string;
  amount: string | number;
  fechaProgramada: Date;
  fechaPago?: Date;
  entityId?: string;
  description?: string;
  paymentMethod?: string;
  referenceId?: string;
  counterparty?: string;
};

const parseBody = async (
  request: NextRequest,
): Promise<Result<MatrixMarkPaidBody, DomainError>> => {
  const body = await request.json();
  const validated = validateWithZod(MatrixMarkPaidSchema, body, "body");
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

  return financialMatrixService.markAsPaid({
    ...parsed.data,
    amount: String(parsed.data.amount),
  });
});

