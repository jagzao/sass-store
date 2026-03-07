import { Result, Ok, Err, isFailure } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
import { z } from "zod";
import { db, payments, orders, eq, and, sql } from "@sass-store/database";
import type { InferSelectModel } from "drizzle-orm";

// Types - DB-backed Payment type
export type Payment = InferSelectModel<typeof payments> & {
  // Extended fields for route compatibility
  userId?: string;
  paymentMethod?: "credit_card" | "debit_card" | "paypal" | "stripe" | "bank_transfer";
  provider?: "stripe" | "paypal" | "square" | "adhoc";
  description?: string;
};

export interface CreatePaymentData {
  userId?: string;
  orderId: string;
  tenantId?: string;
  amount: number;
  currency?: string;
  paymentMethod?: "credit_card" | "debit_card" | "paypal" | "stripe" | "bank_transfer";
  provider?: "stripe" | "paypal" | "square" | "adhoc";
  stripePaymentIntentId?: string;
  status?: "pending" | "processing" | "completed" | "failed" | "refunded";
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdatePaymentData {
  status?: "pending" | "processing" | "completed" | "failed" | "refunded";
  stripePaymentIntentId?: string;
  providerTransactionId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  paidAt?: Date;
}

export interface RefundData {
  amount?: number;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentProcessorResult {
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

// Zod Schemas
const CreatePaymentSchema = z.object({
  userId: z.string().min(1).optional(),
  orderId: z.string().min(1),
  tenantId: z.string().uuid().optional(),
  amount: z.number().positive(),
  currency: z.string().length(3).default("MXN"),
  paymentMethod: z.enum(["credit_card", "debit_card", "paypal", "stripe", "bank_transfer"]).optional(),
  provider: z.enum(["stripe", "paypal", "square", "adhoc"]).optional(),
  stripePaymentIntentId: z.string().optional(),
  status: z.enum(["pending", "processing", "completed", "failed", "refunded"]).optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const UpdatePaymentSchema = z.object({
  status: z.enum(["pending", "processing", "completed", "failed", "refunded"]).optional(),
  stripePaymentIntentId: z.string().optional(),
  providerTransactionId: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  paidAt: z.date().optional(),
});

const RefundSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export class PaymentService {
  // Create a new payment
  async createPayment(
    data: CreatePaymentData,
  ): Promise<Result<Payment, DomainError>> {
    // Validate input data
    const validationResult = validateWithZod(CreatePaymentSchema, data);
    if (isFailure(validationResult)) {
      return validationResult;
    }

    // Verify order exists and get tenant
    let tenantId = data.tenantId;
    
    if (data.orderId) {
      const orderCheck = await db
        .select()
        .from(orders)
        .where(eq(orders.id, data.orderId))
        .limit(1);

      if (orderCheck.length > 0 && !tenantId) {
        tenantId = orderCheck[0].tenantId;
      }
    }

    // Create new payment
    const now = new Date();
    const insertData = {
      orderId: data.orderId,
      tenantId: tenantId || crypto.randomUUID(), // Fallback if no tenant
      amount: data.amount.toString(),
      currency: data.currency || "MXN",
      stripePaymentIntentId: data.stripePaymentIntentId ?? null,
      status: data.status || "pending",
      metadata: {
        ...(data.metadata || {}),
        userId: data.userId,
        paymentMethod: data.paymentMethod,
        provider: data.provider,
        description: data.description,
      } as Record<string, unknown>,
      paidAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.insert(payments).values(insertData).returning();

    if (!result[0]) {
      return Err(
        ErrorFactories.database(
          "create_payment",
          `Failed to create payment for order ${data.orderId}`,
          undefined,
          new Error("No result returned from insert"),
        ),
      );
    }

    // Return with extended fields for compatibility
    const payment: Payment = {
      ...result[0],
      userId: data.userId,
      paymentMethod: data.paymentMethod,
      provider: data.provider,
      description: data.description,
    };

    return Ok(payment);
  }

  // Get payment by ID
  async getPaymentById(id: string): Promise<Result<Payment, DomainError>> {
    if (!id || id.trim().length === 0) {
      return Err(
        ErrorFactories.validation(
          "invalid_payment_id",
          "Payment ID is required",
          "id",
          id,
        ),
      );
    }

    // Try UUID validation, but allow any string for compatibility
    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);

    if (result.length === 0) {
      return Err(
        ErrorFactories.notFound(
          "Payment",
          id,
          `Payment with ID ${id} not found`,
        ),
      );
    }

    // Extract extended fields from metadata
    const metadata = result[0].metadata as Record<string, unknown> || {};
    const payment: Payment = {
      ...result[0],
      userId: metadata.userId as string | undefined,
      paymentMethod: metadata.paymentMethod as Payment["paymentMethod"],
      provider: metadata.provider as Payment["provider"],
      description: metadata.description as string | undefined,
    };

    return Ok(payment);
  }

  // Get payments by order ID
  async getPaymentsByOrderId(
    orderId: string,
  ): Promise<Result<Payment[], DomainError>> {
    if (!orderId || orderId.trim().length === 0) {
      return Err(
        ErrorFactories.validation(
          "invalid_order_id",
          "Order ID is required",
          "orderId",
          orderId,
        ),
      );
    }

    const results = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(payments.createdAt);

    // Map to include extended fields
    const mappedPayments: Payment[] = results.map((p) => {
      const metadata = p.metadata as Record<string, unknown> || {};
      return {
        ...p,
        userId: metadata.userId as string | undefined,
        paymentMethod: metadata.paymentMethod as Payment["paymentMethod"],
        provider: metadata.provider as Payment["provider"],
        description: metadata.description as string | undefined,
      };
    });

    return Ok(mappedPayments);
  }

  // Get payments by user ID (stored in metadata)
  async getPaymentsByUserId(
    userId: string,
  ): Promise<Result<Payment[], DomainError>> {
    if (!userId || userId.trim().length === 0) {
      return Err(
        ErrorFactories.validation(
          "invalid_user_id",
          "User ID is required",
          "userId",
          userId,
        ),
      );
    }

    // Query payments where metadata->userId = userId
    const results = await db
      .select()
      .from(payments)
      .where(sql`${payments.metadata}->>'userId' = ${userId}`)
      .orderBy(payments.createdAt);

    // Map to include extended fields
    const mappedPayments: Payment[] = results.map((p) => {
      const metadata = p.metadata as Record<string, unknown> || {};
      return {
        ...p,
        userId: metadata.userId as string | undefined,
        paymentMethod: metadata.paymentMethod as Payment["paymentMethod"],
        provider: metadata.provider as Payment["provider"],
        description: metadata.description as string | undefined,
      };
    });

    return Ok(mappedPayments);
  }

  // Get payments by tenant ID
  async getPaymentsByTenantId(
    tenantId: string,
  ): Promise<Result<Payment[], DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(tenantId);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_tenant_id",
          "Invalid tenant ID format",
          "tenantId",
          tenantId,
        ),
      );
    }

    const results = await db
      .select()
      .from(payments)
      .where(eq(payments.tenantId, tenantId))
      .orderBy(payments.createdAt);

    // Map to include extended fields
    const mappedPayments: Payment[] = results.map((p) => {
      const metadata = p.metadata as Record<string, unknown> || {};
      return {
        ...p,
        userId: metadata.userId as string | undefined,
        paymentMethod: metadata.paymentMethod as Payment["paymentMethod"],
        provider: metadata.provider as Payment["provider"],
        description: metadata.description as string | undefined,
      };
    });

    return Ok(mappedPayments);
  }

  // Process payment (mark as processing)
  async processPayment(id: string): Promise<Result<Payment, DomainError>> {
    const paymentResult = await this.getPaymentById(id);
    if (isFailure(paymentResult)) {
      return paymentResult;
    }

    const payment = paymentResult.data;

    if (payment.status !== "pending") {
      return Err(
        ErrorFactories.businessRule(
          "payment_not_pending",
          `Payment with ID ${id} is not pending (current status: ${payment.status})`,
          "INVALID_STATUS",
        ),
      );
    }

    // Process with payment provider
    const processorResult = await this.processWithProvider(payment);

    if (processorResult.success) {
      const updateData = {
        status: "processing" as const,
        stripePaymentIntentId: processorResult.transactionId,
        updatedAt: new Date(),
      };

      const result = await db
        .update(payments)
        .set(updateData)
        .where(eq(payments.id, id))
        .returning();

      if (!result[0]) {
        return Err(
          ErrorFactories.database(
            "update_payment_processing",
            `Failed to update payment ${id} to processing status`,
            undefined,
            new Error("No result returned from update"),
          ),
        );
      }

      const metadata = result[0].metadata as Record<string, unknown> || {};
      return Ok({
        ...result[0],
        userId: metadata.userId as string | undefined,
        paymentMethod: metadata.paymentMethod as Payment["paymentMethod"],
        provider: metadata.provider as Payment["provider"],
        description: metadata.description as string | undefined,
      });
    } else {
      // Mark as failed
      await db
        .update(payments)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(payments.id, id));

      return Err(
        ErrorFactories.payment(
          processorResult.errorMessage || "Payment processing failed",
          id,
          "stripe",
        ),
      );
    }
  }

  // Complete payment
  async completePayment(id: string): Promise<Result<Payment, DomainError>> {
    const paymentResult = await this.getPaymentById(id);
    if (isFailure(paymentResult)) {
      return paymentResult;
    }

    const payment = paymentResult.data;

    if (payment.status !== "processing") {
      return Err(
        ErrorFactories.businessRule(
          "payment_not_processing",
          `Payment with ID ${id} is not processing (current status: ${payment.status})`,
          "INVALID_STATUS",
        ),
      );
    }

    const updateData = {
      status: "completed" as const,
      paidAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();

    if (!result[0]) {
      return Err(
        ErrorFactories.database(
          "complete_payment",
          `Failed to complete payment with ID ${id}`,
          undefined,
          new Error("No result returned from update"),
        ),
      );
    }

    const metadata = result[0].metadata as Record<string, unknown> || {};
    return Ok({
      ...result[0],
      userId: metadata.userId as string | undefined,
      paymentMethod: metadata.paymentMethod as Payment["paymentMethod"],
      provider: metadata.provider as Payment["provider"],
      description: metadata.description as string | undefined,
    });
  }

  // Refund payment
  async refundPayment(
    id: string,
    refundData: RefundData,
  ): Promise<Result<Payment, DomainError>> {
    // Validate refund data
    const validationResult = validateWithZod(RefundSchema, refundData);
    if (isFailure(validationResult)) {
      return validationResult;
    }

    const paymentResult = await this.getPaymentById(id);
    if (isFailure(paymentResult)) {
      return paymentResult;
    }

    const payment = paymentResult.data;

    if (payment.status !== "completed") {
      return Err(
        ErrorFactories.businessRule(
          "payment_not_completed",
          `Payment with ID ${id} is not completed (current status: ${payment.status})`,
          "INVALID_STATUS",
        ),
      );
    }

    // Process refund with provider
    const processorResult = await this.refundWithProvider(payment);

    if (processorResult.success) {
      const existingMetadata = (payment.metadata as Record<string, unknown>) || {};
      const updateData = {
        status: "refunded" as const,
        metadata: {
          ...existingMetadata,
          refund: {
            reason: refundData.reason,
            transactionId: processorResult.transactionId,
            at: new Date().toISOString(),
          },
        },
        updatedAt: new Date(),
      };

      const result = await db
        .update(payments)
        .set(updateData)
        .where(eq(payments.id, id))
        .returning();

      if (!result[0]) {
        return Err(
          ErrorFactories.database(
            "refund_payment",
            `Failed to update payment ${id} to refunded status`,
            undefined,
            new Error("No result returned from update"),
          ),
        );
      }

      const metadata = result[0].metadata as Record<string, unknown> || {};
      return Ok({
        ...result[0],
        userId: metadata.userId as string | undefined,
        paymentMethod: metadata.paymentMethod as Payment["paymentMethod"],
        provider: metadata.provider as Payment["provider"],
        description: metadata.description as string | undefined,
      });
    } else {
      return Err(
        ErrorFactories.payment(
          processorResult.errorMessage || "Refund processing failed",
          id,
          "stripe",
        ),
      );
    }
  }

  // Get all payments (admin only)
  async getAllPayments(): Promise<Result<Payment[], DomainError>> {
    const results = await db
      .select()
      .from(payments)
      .orderBy(payments.createdAt);

    // Map to include extended fields
    const mappedPayments: Payment[] = results.map((p) => {
      const metadata = p.metadata as Record<string, unknown> || {};
      return {
        ...p,
        userId: metadata.userId as string | undefined,
        paymentMethod: metadata.paymentMethod as Payment["paymentMethod"],
        provider: metadata.provider as Payment["provider"],
        description: metadata.description as string | undefined,
      };
    });

    return Ok(mappedPayments);
  }

  // Update payment
  async updatePayment(
    id: string,
    data: UpdatePaymentData,
  ): Promise<Result<Payment, DomainError>> {
    if (!id || id.trim().length === 0) {
      return Err(
        ErrorFactories.validation(
          "invalid_payment_id",
          "Payment ID is required",
          "id",
          id,
        ),
      );
    }

    // Validate update data
    const validationResult = validateWithZod(UpdatePaymentSchema, data);
    if (isFailure(validationResult)) {
      return validationResult;
    }

    // Check if payment exists
    const existingPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);

    if (existingPayments.length === 0) {
      return Err(
        ErrorFactories.notFound(
          "Payment",
          id,
          `Payment with ID ${id} not found`,
        ),
      );
    }

    const existingPayment = existingPayments[0];
    const existingMetadata = (existingPayment.metadata as Record<string, unknown>) || {};
    
    // Update metadata with new fields
    const updateData: Record<string, unknown> = {
      status: data.status ?? existingPayment.status,
      stripePaymentIntentId: data.stripePaymentIntentId ?? existingPayment.stripePaymentIntentId,
      updatedAt: new Date(),
    };

    if (data.paidAt) {
      updateData.paidAt = data.paidAt;
    }

    // Merge metadata
    if (data.metadata || data.description || data.providerTransactionId) {
      updateData.metadata = {
        ...existingMetadata,
        ...(data.metadata || {}),
        description: data.description ?? existingMetadata.description,
        providerTransactionId: data.providerTransactionId,
      };
    }

    const result = await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();

    if (!result[0]) {
      return Err(
        ErrorFactories.database(
          "update_payment",
          `Failed to update payment with ID ${id}`,
          undefined,
          new Error("No result returned from update"),
        ),
      );
    }

    const metadata = result[0].metadata as Record<string, unknown> || {};
    return Ok({
      ...result[0],
      userId: metadata.userId as string | undefined,
      paymentMethod: metadata.paymentMethod as Payment["paymentMethod"],
      provider: metadata.provider as Payment["provider"],
      description: metadata.description as string | undefined,
    });
  }

  // Helper methods for payment processing (mock implementations for now)
  private async processWithProvider(
    payment: Payment,
  ): Promise<PaymentProcessorResult> {
    // Mock payment processing - in production, integrate with Stripe/PayPal
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate network delay

    // For demo purposes, let's simulate some failures
    const amount = parseFloat(payment.amount);
    if (amount > 10000) {
      return {
        success: false,
        errorMessage: "Amount exceeds limit",
      };
    }

    return {
      success: true,
      transactionId: `pi_stripe_${Date.now()}`,
      metadata: {
        processedAt: new Date().toISOString(),
        amount: payment.amount,
        currency: payment.currency,
      },
    };
  }

  private async refundWithProvider(
    payment: Payment,
  ): Promise<PaymentProcessorResult> {
    // Mock refund processing - in production, integrate with Stripe/PayPal
    await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate network delay

    return {
      success: true,
      transactionId: `re_stripe_${Date.now()}`,
      metadata: {
        refundedAt: new Date().toISOString(),
        amount: payment.amount,
        currency: payment.currency,
      },
    };
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
