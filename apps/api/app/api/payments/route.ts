import { NextRequest } from "next/server";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
import { z } from "zod";
import { PaymentService } from "../../../lib/services/PaymentService";
import {
  authenticateRequest,
  AuthenticatedRequest,
} from "@sass-store/core/src/middleware/auth-middleware";
import { Err } from "@sass-store/core/src/result";
import { ErrorFactories } from "@sass-store/core/src/errors/types";

// Schemas for validation
const CreatePaymentSchema = z.object({
  userId: z.string().uuid(),
  orderId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  paymentMethod: z.enum([
    "credit_card",
    "debit_card",
    "paypal",
    "stripe",
    "bank_transfer",
  ]),
  provider: z.enum(["stripe", "paypal", "square", "adhoc"]),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const UpdatePaymentSchema = z.object({
  status: z
    .enum(["pending", "processing", "completed", "failed", "refunded"])
    .optional(),
  providerTransactionId: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const RefundSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const paymentService = new PaymentService();

// GET /api/payments - Get payments with filtering
export const GET = withResultHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const orderId = searchParams.get("orderId");
  const paymentId = searchParams.get("paymentId");

  // Authenticate the request
  const authResult = await authenticateRequest(request);
  if (!authResult.success) {
    return authResult;
  }

  const authenticatedRequest = authResult.success
    ? authResult.data
    : (request as AuthenticatedRequest);

  if (paymentId) {
    // Get specific payment
    const uuidValidation = CommonSchemas.uuid.parse(paymentId);
    if (!uuidValidation.success) {
      return uuidValidation;
    }

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
          "You can only access your own payments",
          "payment_access",
        ),
      );
    }

    return paymentResult;
  } else if (userId) {
    // Get payments by user
    const uuidValidation = CommonSchemas.uuid.parse(userId);
    if (!uuidValidation.success) {
      return uuidValidation;
    }

    // Check if user is requesting their own payments or is admin
    if (
      authenticatedRequest.user?.role !== "admin" &&
      userId !== authenticatedRequest.user?.userId
    ) {
      return Err(
        ErrorFactories.authorization(
          "You can only access your own payments",
          "payment_access",
        ),
      );
    }

    return await paymentService.getPaymentsByUserId(userId);
  } else if (orderId) {
    // Get payments by order
    const uuidValidation = CommonSchemas.uuid.parse(orderId);
    if (!uuidValidation.success) {
      return uuidValidation;
    }

    return await paymentService.getPaymentsByOrderId(orderId);
  } else {
    // Get all payments (admin only)
    if (authenticatedRequest.user?.role !== "admin") {
      return Err(
        ErrorFactories.authorization(
          "Admin access required to view all payments",
          "admin_required",
        ),
      );
    }

    return await paymentService.getAllPayments();
  }
});

// POST /api/payments - Create new payment
export const POST = withResultHandler(async (request: NextRequest) => {
  // Authenticate the request
  const authResult = await authenticateRequest(request);
  if (!authResult.success) {
    return authResult;
  }

  const body = await request.json();
  const validation = validateWithZod(CreatePaymentSchema, body);
  if (!validation.success) {
    return validation;
  }

  const {
    userId,
    orderId,
    amount,
    currency,
    paymentMethod,
    provider,
    description,
    metadata,
  } = validation.data;

  // Check if user is creating their own payment or is admin
  const authenticatedRequest = authResult.success
    ? authResult.data
    : (request as AuthenticatedRequest);
  if (
    authenticatedRequest.user?.role !== "admin" &&
    userId !== authenticatedRequest.user?.userId
  ) {
    return Err(
      ErrorFactories.authorization(
        "You can only create payments for yourself",
        "payment_creation",
      ),
    );
  }

  return await paymentService.createPayment({
    userId,
    orderId,
    amount,
    currency,
    paymentMethod,
    provider,
    description,
    metadata,
  });
});

// PUT /api/payments - Update payment status
export const PUT = withResultHandler(async (request: NextRequest) => {
  // Authenticate the request
  const authResult = await authenticateRequest(request);
  if (!authResult.success) {
    return authResult;
  }

  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get("paymentId");

  if (!paymentId) {
    return Err(
      ErrorFactories.validation(
        "missing_payment_id",
        "Payment ID is required for updates",
      ),
    );
  }

  const uuidValidation = CommonSchemas.uuid.parse(paymentId);
  if (!uuidValidation.success) {
    return uuidValidation;
  }

  const body = await request.json();
  const updateValidation = validateWithZod(UpdatePaymentSchema, body);
  if (!updateValidation.success) {
    return updateValidation;
  }

  const authenticatedRequest = authResult.success
    ? authResult.data
    : (request as AuthenticatedRequest);

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
        "You can only update your own payments",
        "payment_update",
      ),
    );
  }

  return await paymentService.updatePayment(paymentId, updateValidation.data);
});
