import { Result, Ok, Err, isFailure } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
import { z } from "zod";

// Types
export interface Payment {
  id: string;
  userId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
  paymentMethod:
    | "credit_card"
    | "debit_card"
    | "paypal"
    | "stripe"
    | "bank_transfer";
  provider: "stripe" | "paypal" | "square" | "adhoc";
  providerTransactionId?: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface CreatePaymentData {
  userId: string;
  orderId: string;
  amount: number;
  currency?: string;
  paymentMethod: Payment["paymentMethod"];
  provider: Payment["provider"];
  description?: string;
  metadata?: Record<string, any>;
}

export interface UpdatePaymentData {
  status?: Payment["status"];
  providerTransactionId?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface RefundData {
  amount?: number; // If not provided, refund full amount
  reason?: string;
  metadata?: Record<string, any>;
}

export interface PaymentMethodDetails {
  type: Payment["paymentMethod"];
  details: Record<string, any>;
}

export interface PaymentProcessorResult {
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

// Mock Database for Payments
class PaymentDatabase {
  private payments: Map<string, Payment> = new Map();

  async create(payment: Payment): Promise<Payment> {
    this.payments.set(payment.id, payment);
    return payment;
  }

  async findById(id: string): Promise<Payment | null> {
    return this.payments.get(id) || null;
  }

  async findByOrderId(orderId: string): Promise<Payment[]> {
    const payments: Payment[] = [];
    for (const payment of this.payments.values()) {
      if (payment.orderId === orderId) {
        payments.push(payment);
      }
    }
    return payments;
  }

  async findByUserId(userId: string): Promise<Payment[]> {
    const payments: Payment[] = [];
    for (const payment of this.payments.values()) {
      if (payment.userId === userId) {
        payments.push(payment);
      }
    }
    return payments;
  }

  async findAll(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }

  async update(id: string, updates: Partial<Payment>): Promise<Payment> {
    const existingPayment = this.payments.get(id);
    if (!existingPayment) {
      throw new Error(`Payment with ID ${id} not found`);
    }

    const updatedPayment = { ...existingPayment, ...updates };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  async delete(id: string): Promise<boolean> {
    return this.payments.delete(id);
  }

  // Clear all data (for testing)
  clear(): void {
    this.payments.clear();
  }

  // Get current count
  count(): number {
    return this.payments.size;
  }
}

// Zod Schemas
const PaymentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  orderId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  status: z.enum(["pending", "processing", "completed", "failed", "refunded"]),
  paymentMethod: z.enum([
    "credit_card",
    "debit_card",
    "paypal",
    "stripe",
    "bank_transfer",
  ]),
  provider: z.enum(["stripe", "paypal", "square", "adhoc"]),
  providerTransactionId: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
});

const CreatePaymentSchema = z.object({
  userId: z.string().uuid(),
  orderId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
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

export class PaymentService {
  private db: PaymentDatabase;

  constructor(database?: PaymentDatabase) {
    this.db = database || new PaymentDatabase();
  }

  // Create a new payment
  async createPayment(
    data: CreatePaymentData,
  ): Promise<Result<Payment, DomainError>> {
    // Validate input data
    const validationResult = validateWithZod(CreatePaymentSchema, data);
    if (isFailure(validationResult)) {
      return validationResult;
    }

    // Create new payment
    const now = new Date();
    const newPayment: Payment = {
      id: crypto.randomUUID(),
      userId: data.userId,
      orderId: data.orderId,
      amount: data.amount,
      currency: data.currency || "USD",
      status: "pending",
      paymentMethod: data.paymentMethod,
      provider: data.provider,
      description: data.description,
      metadata: data.metadata,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const createdPayment = await this.db.create(newPayment);
      return Ok(createdPayment);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "create_payment",
          `Failed to create payment for order ${data.orderId}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Get payment by ID
  async getPaymentById(id: string): Promise<Result<Payment, DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(id);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_payment_id",
          "Invalid payment ID format",
          "id",
          id,
        ),
      );
    }

    try {
      const payment = await this.db.findById(id);
      if (!payment) {
        return Err(
          ErrorFactories.notFound(
            "Payment",
            id,
            `Payment with ID ${id} not found`,
          ),
        );
      }
      return Ok(payment);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "get_payment_by_id",
          `Failed to get payment with ID ${id}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Get payments by order ID
  async getPaymentsByOrderId(
    orderId: string,
  ): Promise<Result<Payment[], DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(orderId);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_order_id",
          "Invalid order ID format",
          "orderId",
          orderId,
        ),
      );
    }

    try {
      const payments = await this.db.findByOrderId(orderId);
      return Ok(payments);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "get_payments_by_order",
          `Failed to get payments for order ${orderId}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Get payments by user ID
  async getPaymentsByUserId(
    userId: string,
  ): Promise<Result<Payment[], DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(userId);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_user_id",
          "Invalid user ID format",
          "userId",
          userId,
        ),
      );
    }

    try {
      const payments = await this.db.findByUserId(userId);
      return Ok(payments);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "get_payments_by_user",
          `Failed to get payments for user ${userId}`,
          undefined,
          error as Error,
        ),
      );
    }
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
      const updatedPayment: Payment = {
        ...payment,
        status: "processing",
        providerTransactionId: processorResult.transactionId,
        updatedAt: new Date(),
      };

      try {
        const savedPayment = await this.db.update(id, updatedPayment);
        return Ok(savedPayment);
      } catch (error) {
        return Err(
          ErrorFactories.database(
            "update_payment_processing",
            `Failed to update payment ${id} to processing status`,
            undefined,
            error as Error,
          ),
        );
      }
    } else {
      // Mark as failed
      const failedPayment: Payment = {
        ...payment,
        status: "failed",
        updatedAt: new Date(),
      };

      try {
        await this.db.update(id, failedPayment);
      } catch (updateError) {
        // Log update error but return processor error
        console.error(
          "Failed to update payment to failed status:",
          updateError,
        );
      }

      return Err(
        ErrorFactories.payment(
          processorResult.errorMessage || "Payment processing failed",
          id,
          payment.provider,
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

    const completedPayment: Payment = {
      ...payment,
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const updatedPayment = await this.db.update(id, completedPayment);
      return Ok(updatedPayment);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "complete_payment",
          `Failed to complete payment with ID ${id}`,
          undefined,
          error as Error,
        ),
      );
    }
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

    // Check refund amount
    const refundAmount = refundData.amount || payment.amount;
    if (refundAmount > payment.amount) {
      return Err(
        ErrorFactories.businessRule(
          "refund_amount_exceeds_payment",
          `Refund amount ${refundAmount} exceeds payment amount ${payment.amount}`,
          "INVALID_REFUND_AMOUNT",
        ),
      );
    }

    // Process refund with provider
    const processorResult = await this.refundWithProvider(
      payment,
      refundAmount,
    );

    if (processorResult.success) {
      const refundedPayment: Payment = {
        ...payment,
        status: "refunded",
        updatedAt: new Date(),
        metadata: {
          ...payment.metadata,
          refund: {
            amount: refundAmount,
            reason: refundData.reason,
            transactionId: processorResult.transactionId,
            at: new Date().toISOString(),
          },
        },
      };

      try {
        const updatedPayment = await this.db.update(id, refundedPayment);
        return Ok(updatedPayment);
      } catch (error) {
        return Err(
          ErrorFactories.database(
            "refund_payment",
            `Failed to update payment ${id} to refunded status`,
            undefined,
            error as Error,
          ),
        );
      }
    } else {
      return Err(
        ErrorFactories.payment(
          processorResult.errorMessage || "Refund processing failed",
          id,
          payment.provider,
        ),
      );
    }
  }

  // Get all payments (admin only)
  async getAllPayments(): Promise<Result<Payment[], DomainError>> {
    try {
      const payments = await this.db.findAll();
      return Ok(payments);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "get_all_payments",
          "Failed to retrieve all payments",
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Update payment
  async updatePayment(
    id: string,
    data: UpdatePaymentData,
  ): Promise<Result<Payment, DomainError>> {
    // Validate ID
    const uuidValidation = CommonSchemas.uuid.parse(id);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_payment_id",
          "Invalid payment ID format",
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
    const existingPayment = await this.db.findById(id);
    if (!existingPayment) {
      return Err(
        ErrorFactories.notFound(
          "Payment",
          id,
          `Payment with ID ${id} not found`,
        ),
      );
    }

    // Update payment
    const updatedPayment: Payment = {
      ...existingPayment,
      ...data,
      updatedAt: new Date(),
    };

    try {
      const payment = await this.db.update(id, updatedPayment);
      return Ok(payment);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "update_payment",
          `Failed to update payment with ID ${id}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Helper methods for payment processing (mock implementations)
  private async processWithProvider(
    payment: Payment,
  ): Promise<PaymentProcessorResult> {
    // Mock payment processing
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate network delay

    // For demo purposes, let's simulate some failures
    if (payment.amount > 10000) {
      return {
        success: false,
        errorMessage: "Amount exceeds limit",
      };
    }

    return {
      success: true,
      transactionId: `txn_${payment.provider}_${Date.now()}`,
      metadata: {
        processedAt: new Date().toISOString(),
        amount: payment.amount,
        currency: payment.currency,
      },
    };
  }

  private async refundWithProvider(
    payment: Payment,
    amount: number,
  ): Promise<PaymentProcessorResult> {
    // Mock refund processing
    await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate network delay

    return {
      success: true,
      transactionId: `refund_${payment.provider}_${Date.now()}`,
      metadata: {
        refundedAt: new Date().toISOString(),
        amount,
        currency: payment.currency,
      },
    };
  }

  // Get database instance (for testing)
  getDatabase(): PaymentDatabase {
    return this.db;
  }
}
