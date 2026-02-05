import { NextRequest } from "next/server";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
import { z } from "zod";
import { PaymentService } from "../../../../../lib/services/PaymentService";
import {
  authenticateRequest,
  AuthenticatedRequest,
} from "@sass-store/core/src/middleware/auth-middleware";
import { Err } from "@sass-store/core/src/result";
import { ErrorFactories } from "@sass-store/core/src/errors/types";

// Schema for refund
const RefundSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const paymentService = new PaymentService();

// POST /api/payments/[paymentId]/refund - Refund a payment
export async function POST(
  request: NextRequest,
  { params }: { params: { paymentId: string } },
) {
  return withResultHandler(async (req: NextRequest) => {
    const { paymentId } = params;

    // Validate payment ID
    const uuidValidation = CommonSchemas.uuid.parse(paymentId);
    if (!uuidValidation.success) {
      return uuidValidation;
    }

    // Authenticate the request
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return authResult;
    }

    const body = await req.json();
    const validation = validateWithZod(RefundSchema, body);
    if (!validation.success) {
      return validation;
    }

    const authenticatedRequest = authResult.success
      ? authResult.data
      : (req as AuthenticatedRequest);

    // Get payment first to check ownership
    const paymentResult = await paymentService.getPaymentById(paymentId);
    if (!paymentResult.success) {
      return paymentResult;
    }

    // Check if user owns this payment or is admin
    if (
      authenticatedRequest.user?.role !== "admin" &&
      paymentResult.data.userId !== authenticatedRequest.user?.userId
    ) {
      return Err(
        ErrorFactories.authorization(
          "You can only refund your own payments",
          "payment_refund",
        ),
      );
    }

    // Check if payment can be refunded (must be completed)
    if (paymentResult.data.status !== "completed") {
      return Err(
        ErrorFactories.businessRule(
          "payment_not_completed",
          "Only completed payments can be refunded",
        ),
      );
    }

    return await paymentService.refundPayment(paymentId, validation.data);
  })(request);
}
