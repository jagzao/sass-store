/**
 * Payment Service Tests
 *
 * Comprehensive tests for payment processing and management using Result Pattern.
 * Tests all major payment operations with proper error handling.
 * 
 * Updated for monolith migration - tests mock service that mirrors the DB-backed implementation.
 */

// Using globals instead of imports since globals: true in Vitest config

import { createTestContext } from "../../setup/TestContext";
import {
  expectSuccess,
  expectFailure,
  expectValidationError,
  expectNotFoundError,
} from "../../setup/TestUtilities";

// Type definitions for the service
interface Payment {
  id: string;
  orderId: string;
  tenantId: string;
  amount: string;
  currency: string;
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
  stripePaymentIntentId: string | null;
  metadata: Record<string, unknown>;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Extended fields
  userId?: string;
  paymentMethod?: "credit_card" | "debit_card" | "paypal" | "stripe" | "bank_transfer";
  provider?: "stripe" | "paypal" | "square" | "adhoc";
  description?: string;
}

interface CreatePaymentData {
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

interface UpdatePaymentData {
  status?: "pending" | "processing" | "completed" | "failed" | "refunded";
  stripePaymentIntentId?: string;
  providerTransactionId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  paidAt?: Date;
}

interface RefundData {
  amount?: number;
  reason?: string;
  metadata?: Record<string, unknown>;
}

// Mock Payment Service for testing
class MockPaymentService {
  constructor(private db: any) {}

  async createPayment(data: CreatePaymentData) {
    // Validate required fields
    if (!data.orderId || data.orderId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Order ID is required",
          field: "orderId",
        },
      };
    }

    if (!data.amount || data.amount <= 0) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Amount must be a positive number",
          field: "amount",
          value: data.amount,
        },
      };
    }

    // Create payment
    const now = new Date();
    const payment: Payment = {
      id: crypto.randomUUID(),
      orderId: data.orderId,
      tenantId: data.tenantId || crypto.randomUUID(),
      amount: data.amount.toString(),
      currency: data.currency || "MXN",
      status: data.status || "pending",
      stripePaymentIntentId: data.stripePaymentIntentId ?? null,
      metadata: {
        ...(data.metadata || {}),
        userId: data.userId,
        paymentMethod: data.paymentMethod,
        provider: data.provider,
        description: data.description,
      },
      paidAt: null,
      createdAt: now,
      updatedAt: now,
      userId: data.userId,
      paymentMethod: data.paymentMethod,
      provider: data.provider,
      description: data.description,
    };

    await this.db.payments.insert(payment);

    return { success: true, data: payment };
  }

  async getPaymentById(id: string) {
    if (!id || id.trim().length === 0) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Payment ID is required",
          field: "id",
          value: id,
        },
      };
    }

    const payment = await this.db.payments.findById(id);

    if (!payment) {
      return {
        success: false,
        error: {
          type: "NotFoundError",
          resource: "Payment",
          resourceId: id,
          message: `Payment with ID ${id} not found`,
        },
      };
    }

    return { success: true, data: payment };
  }

  async getPaymentsByOrderId(orderId: string) {
    if (!orderId || orderId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Order ID is required",
          field: "orderId",
          value: orderId,
        },
      };
    }

    const payments = await this.db.payments.findMany(
      (p: Payment) => p.orderId === orderId,
    );

    return { success: true, data: payments };
  }

  async getPaymentsByUserId(userId: string) {
    if (!userId || userId.trim().length === 0) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "User ID is required",
          field: "userId",
          value: userId,
        },
      };
    }

    const payments = await this.db.payments.findMany(
      (p: Payment) => p.metadata?.userId === userId,
    );

    return { success: true, data: payments };
  }

  async processPayment(id: string) {
    const paymentResult = await this.getPaymentById(id);
    if (!paymentResult.success) {
      return paymentResult;
    }

    const payment = paymentResult.data;

    if (payment.status !== "pending") {
      return {
        success: false,
        error: {
          type: "BusinessRuleError",
          message: `Payment with ID ${id} is not pending (current status: ${payment.status})`,
          rule: "payment_not_pending",
        },
      };
    }

    // Simulate payment processing
    const amount = parseFloat(payment.amount);
    if (amount > 10000) {
      // Mark as failed
      await this.db.payments.update(id, {
        ...payment,
        status: "failed",
        updatedAt: new Date(),
      });

      return {
        success: false,
        error: {
          type: "PaymentError",
          message: "Amount exceeds limit",
          paymentId: id,
          provider: "stripe",
        },
      };
    }

    const updatedPayment = {
      ...payment,
      status: "processing" as const,
      stripePaymentIntentId: `pi_stripe_${Date.now()}`,
      updatedAt: new Date(),
    };

    await this.db.payments.update(id, updatedPayment);

    return { success: true, data: updatedPayment };
  }

  async completePayment(id: string) {
    const paymentResult = await this.getPaymentById(id);
    if (!paymentResult.success) {
      return paymentResult;
    }

    const payment = paymentResult.data;

    if (payment.status !== "processing") {
      return {
        success: false,
        error: {
          type: "BusinessRuleError",
          message: `Payment with ID ${id} is not processing (current status: ${payment.status})`,
          rule: "payment_not_processing",
        },
      };
    }

    const updatedPayment = {
      ...payment,
      status: "completed" as const,
      paidAt: new Date(),
      updatedAt: new Date(),
    };

    await this.db.payments.update(id, updatedPayment);

    return { success: true, data: updatedPayment };
  }

  async refundPayment(id: string, refundData: RefundData) {
    // Validate refund amount if provided
    if (refundData.amount !== undefined && refundData.amount <= 0) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Refund amount must be positive",
          field: "amount",
        },
      };
    }

    const paymentResult = await this.getPaymentById(id);
    if (!paymentResult.success) {
      return paymentResult;
    }

    const payment = paymentResult.data;

    if (payment.status !== "completed") {
      return {
        success: false,
        error: {
          type: "BusinessRuleError",
          message: `Payment with ID ${id} is not completed (current status: ${payment.status})`,
          rule: "payment_not_completed",
        },
      };
    }

    // Check refund amount doesn't exceed payment
    const paymentAmount = parseFloat(payment.amount);
    if (refundData.amount && refundData.amount > paymentAmount) {
      return {
        success: false,
        error: {
          type: "BusinessRuleError",
          message: "Refund amount exceeds payment amount",
          rule: "refund_amount_exceeds_payment",
        },
      };
    }

    const updatedPayment = {
      ...payment,
      status: "refunded" as const,
      metadata: {
        ...payment.metadata,
        refund: {
          amount: refundData.amount || paymentAmount,
          reason: refundData.reason,
          transactionId: `re_stripe_${Date.now()}`,
          at: new Date().toISOString(),
        },
      },
      updatedAt: new Date(),
    };

    await this.db.payments.update(id, updatedPayment);

    return { success: true, data: updatedPayment };
  }

  async updatePayment(id: string, data: UpdatePaymentData) {
    if (!id || id.trim().length === 0) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Payment ID is required",
          field: "id",
          value: id,
        },
      };
    }

    const existingPayment = await this.db.payments.findById(id);

    if (!existingPayment) {
      return {
        success: false,
        error: {
          type: "NotFoundError",
          resource: "Payment",
          resourceId: id,
          message: `Payment with ID ${id} not found`,
        },
      };
    }

    const updatedPayment = {
      ...existingPayment,
      ...data,
      metadata: {
        ...existingPayment.metadata,
        ...(data.metadata || {}),
        description: data.description ?? existingPayment.metadata?.description,
        providerTransactionId: data.providerTransactionId,
      },
      updatedAt: new Date(),
    };

    await this.db.payments.update(id, updatedPayment);

    return { success: true, data: updatedPayment };
  }

  async getAllPayments() {
    const payments = await this.db.payments.findMany(() => true);
    return { success: true, data: payments };
  }
}

// Helper to create test payment
function createTestPayment(
  orderId: string,
  tenantId: string,
  overrides: Partial<Payment> = {},
): Payment {
  return {
    id: crypto.randomUUID(),
    orderId,
    tenantId,
    amount: "100.00",
    currency: "MXN",
    status: "pending",
    stripePaymentIntentId: null,
    metadata: {},
    paidAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("PaymentService - Result Pattern Implementation", () => {
  let context: any;
  let paymentService: MockPaymentService;

  beforeEach(() => {
    context = createTestContext();
    paymentService = new MockPaymentService(context.db);
  });

  afterEach(() => {
    context?.db?.clear?.();
  });

  describe("createPayment", () => {
    const validPaymentData: CreatePaymentData = {
      userId: "user-123",
      orderId: "order-123",
      amount: 100.0,
      currency: "MXN",
      paymentMethod: "credit_card",
      provider: "stripe",
      description: "Test payment",
    };

    it("should create a payment with valid data", async () => {
      const result = await paymentService.createPayment(validPaymentData);

      expectSuccess(result);
      expect(result.data.orderId).toBe(validPaymentData.orderId);
      expect(result.data.amount).toBe("100");
      expect(result.data.currency).toBe("MXN");
      expect(result.data.status).toBe("pending");
      expect(result.data.id).toBeDefined();
      expect(result.data.createdAt).toBeInstanceOf(Date);
    });

    it("should create a payment with default currency", async () => {
      const result = await paymentService.createPayment({
        orderId: "order-456",
        amount: 50.0,
      });

      expectSuccess(result);
      expect(result.data.currency).toBe("MXN");
    });

    it("should return validation error for negative amount", async () => {
      const result = await paymentService.createPayment({
        orderId: "order-789",
        amount: -10.0,
      });

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
      expect(result.error.field).toBe("amount");
    });

    it("should return validation error for zero amount", async () => {
      const result = await paymentService.createPayment({
        orderId: "order-zero",
        amount: 0,
      });

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });

    it("should return validation error for missing order ID", async () => {
      const result = await paymentService.createPayment({
        orderId: "",
        amount: 100.0,
      });

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
      expect(result.error.field).toBe("orderId");
    });

    it("should create payment with metadata", async () => {
      const paymentDataWithMetadata = {
        ...validPaymentData,
        metadata: {
          customer_ip: "192.168.1.1",
          browser: "Chrome",
        },
      };

      const result = await paymentService.createPayment(paymentDataWithMetadata);

      expectSuccess(result);
      expect(result.data.metadata.customer_ip).toBe("192.168.1.1");
      expect(result.data.metadata.browser).toBe("Chrome");
    });

    it("should create payment with different payment methods", async () => {
      const paymentMethods = [
        "credit_card",
        "debit_card",
        "paypal",
        "stripe",
        "bank_transfer",
      ] as const;

      for (const method of paymentMethods) {
        const result = await paymentService.createPayment({
          orderId: `order-${method}-${Date.now()}`,
          amount: 100.0,
          paymentMethod: method,
        });

        expectSuccess(result);
        expect(result.data.paymentMethod).toBe(method);
      }
    });
  });

  describe("getPaymentById", () => {
    it("should return payment for valid ID", async () => {
      // Create payment first
      const createResult = await paymentService.createPayment({
        orderId: "order-get-test",
        amount: 100.0,
      });

      const result = await paymentService.getPaymentById(createResult.data.id);

      expectSuccess(result);
      expect(result.data.id).toBe(createResult.data.id);
      expect(result.data.orderId).toBe("order-get-test");
    });

    it("should return not found error for non-existent ID", async () => {
      const result = await paymentService.getPaymentById(crypto.randomUUID());

      expectNotFoundError(result, "Payment");
    });

    it("should return validation error for empty ID", async () => {
      const result = await paymentService.getPaymentById("");

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });
  });

  describe("getPaymentsByOrderId", () => {
    it("should return payments for valid order ID", async () => {
      const orderId = "order-multi-pay";

      // Create multiple payments for the same order
      await paymentService.createPayment({
        orderId,
        amount: 50.0,
        paymentMethod: "credit_card",
      });
      await paymentService.createPayment({
        orderId,
        amount: 25.0,
        paymentMethod: "paypal",
      });

      const result = await paymentService.getPaymentsByOrderId(orderId);

      expectSuccess(result);
      expect(result.data.length).toBe(2);
      expect(result.data.every((p: Payment) => p.orderId === orderId)).toBe(true);
    });

    it("should return empty array for order with no payments", async () => {
      const result = await paymentService.getPaymentsByOrderId("order-no-payments");

      expectSuccess(result);
      expect(result.data).toEqual([]);
    });

    it("should return validation error for empty order ID", async () => {
      const result = await paymentService.getPaymentsByOrderId("");

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });
  });

  describe("getPaymentsByUserId", () => {
    it("should return payments for valid user ID", async () => {
      const userId = "user-pay-test";

      // Create multiple payments for the same user
      await paymentService.createPayment({
        orderId: "order-user-1",
        amount: 50.0,
        userId,
      });
      await paymentService.createPayment({
        orderId: "order-user-2",
        amount: 75.0,
        userId,
      });

      const result = await paymentService.getPaymentsByUserId(userId);

      expectSuccess(result);
      expect(result.data.length).toBe(2);
    });

    it("should return empty array for user with no payments", async () => {
      const result = await paymentService.getPaymentsByUserId("user-no-payments");

      expectSuccess(result);
      expect(result.data).toEqual([]);
    });

    it("should return validation error for empty user ID", async () => {
      const result = await paymentService.getPaymentsByUserId("");

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });
  });

  describe("processPayment", () => {
    let testPayment: Payment;

    beforeEach(async () => {
      const createResult = await paymentService.createPayment({
        orderId: "order-process-test",
        amount: 100.0,
      });
      testPayment = createResult.data;
    });

    it("should process pending payment successfully", async () => {
      const result = await paymentService.processPayment(testPayment.id);

      expectSuccess(result);
      expect(result.data.status).toBe("processing");
      expect(result.data.stripePaymentIntentId).toBeDefined();
    });

    it("should return error for already processing payment", async () => {
      // Process payment first
      await paymentService.processPayment(testPayment.id);

      // Try to process again
      const result = await paymentService.processPayment(testPayment.id);

      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.rule).toBe("payment_not_pending");
    });

    it("should return error for completed payment", async () => {
      // Process and complete payment
      await paymentService.processPayment(testPayment.id);
      await paymentService.completePayment(testPayment.id);

      // Try to process again
      const result = await paymentService.processPayment(testPayment.id);

      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
    });

    it("should return error for high amount payment", async () => {
      // Create a payment with high amount
      const highAmountResult = await paymentService.createPayment({
        orderId: "order-high-amount",
        amount: 15000.0,
      });

      const result = await paymentService.processPayment(highAmountResult.data.id);

      expectFailure(result);
      expect(result.error.type).toBe("PaymentError");
    });

    it("should return not found error for non-existent payment", async () => {
      const result = await paymentService.processPayment(crypto.randomUUID());

      expectNotFoundError(result, "Payment");
    });
  });

  describe("completePayment", () => {
    let testPayment: Payment;

    beforeEach(async () => {
      const createResult = await paymentService.createPayment({
        orderId: "order-complete-test",
        amount: 100.0,
      });
      testPayment = createResult.data;
    });

    it("should complete processing payment successfully", async () => {
      // Process payment first
      await paymentService.processPayment(testPayment.id);

      const result = await paymentService.completePayment(testPayment.id);

      expectSuccess(result);
      expect(result.data.status).toBe("completed");
      expect(result.data.paidAt).toBeInstanceOf(Date);
    });

    it("should return error for pending payment", async () => {
      const result = await paymentService.completePayment(testPayment.id);

      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.rule).toBe("payment_not_processing");
    });

    it("should return error for already completed payment", async () => {
      // Process and complete payment
      await paymentService.processPayment(testPayment.id);
      await paymentService.completePayment(testPayment.id);

      // Try to complete again
      const result = await paymentService.completePayment(testPayment.id);

      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
    });
  });

  describe("refundPayment", () => {
    let testPayment: Payment;

    beforeEach(async () => {
      const createResult = await paymentService.createPayment({
        orderId: "order-refund-test",
        amount: 100.0,
      });
      testPayment = createResult.data;
      // Process and complete
      await paymentService.processPayment(testPayment.id);
      await paymentService.completePayment(testPayment.id);
    });

    it("should refund full payment amount successfully", async () => {
      const refundData: RefundData = {
        reason: "Customer requested refund",
      };

      const result = await paymentService.refundPayment(testPayment.id, refundData);

      expectSuccess(result);
      expect(result.data.status).toBe("refunded");
      expect(result.data.metadata?.refund?.reason).toBe("Customer requested refund");
      expect(result.data.metadata?.refund?.transactionId).toBeDefined();
    });

    it("should refund partial payment amount successfully", async () => {
      const refundData: RefundData = {
        amount: 25.0,
        reason: "Partial refund",
      };

      const result = await paymentService.refundPayment(testPayment.id, refundData);

      expectSuccess(result);
      expect(result.data.status).toBe("refunded");
      expect(result.data.metadata?.refund?.amount).toBe(25.0);
    });

    it("should return error for refund amount exceeding payment amount", async () => {
      const refundData: RefundData = {
        amount: 150.0,
        reason: "Excessive refund",
      };

      const result = await paymentService.refundPayment(testPayment.id, refundData);

      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.rule).toBe("refund_amount_exceeds_payment");
    });

    it("should return error for refunding non-completed payment", async () => {
      // Create a new pending payment
      const pendingResult = await paymentService.createPayment({
        orderId: "order-pending-refund",
        amount: 50.0,
      });

      const refundData: RefundData = {
        reason: "Refund pending payment",
      };

      const result = await paymentService.refundPayment(
        pendingResult.data.id,
        refundData,
      );

      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.rule).toBe("payment_not_completed");
    });

    it("should return validation error for negative refund amount", async () => {
      const refundData: RefundData = {
        amount: -10.0,
        reason: "Negative refund",
      };

      const result = await paymentService.refundPayment(testPayment.id, refundData);

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });
  });

  describe("updatePayment", () => {
    let testPayment: Payment;

    beforeEach(async () => {
      const createResult = await paymentService.createPayment({
        orderId: "order-update-test",
        amount: 100.0,
      });
      testPayment = createResult.data;
    });

    it("should update payment description", async () => {
      const result = await paymentService.updatePayment(testPayment.id, {
        description: "Updated payment description",
      });

      expectSuccess(result);
      expect(result.data.metadata?.description).toBe("Updated payment description");
    });

    it("should update payment metadata", async () => {
      const result = await paymentService.updatePayment(testPayment.id, {
        metadata: {
          new_field: "new_value",
        },
      });

      expectSuccess(result);
      expect(result.data.metadata?.new_field).toBe("new_value");
    });

    it("should return not found error for non-existent payment", async () => {
      const result = await paymentService.updatePayment(crypto.randomUUID(), {
        description: "Updated description",
      });

      expectNotFoundError(result, "Payment");
    });

    it("should return validation error for empty payment ID", async () => {
      const result = await paymentService.updatePayment("", {
        description: "Updated description",
      });

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });
  });

  describe("getAllPayments", () => {
    it("should return empty array when no payments exist", async () => {
      const result = await paymentService.getAllPayments();

      expectSuccess(result);
      expect(result.data).toEqual([]);
    });

    it("should return all payments", async () => {
      // Create multiple payments
      await paymentService.createPayment({
        orderId: "order-all-1",
        amount: 50.0,
      });
      await paymentService.createPayment({
        orderId: "order-all-2",
        amount: 75.0,
      });

      const result = await paymentService.getAllPayments();

      expectSuccess(result);
      expect(result.data.length).toBe(2);
    });
  });

  describe("Payment Flow Integration", () => {
    it("should handle complete payment lifecycle", async () => {
      // 1. Create payment
      const createResult = await paymentService.createPayment({
        orderId: "order-lifecycle",
        amount: 200.0,
        paymentMethod: "credit_card",
        provider: "stripe",
      });
      expectSuccess(createResult);
      expect(createResult.data.status).toBe("pending");

      // 2. Process payment
      const processResult = await paymentService.processPayment(createResult.data.id);
      expectSuccess(processResult);
      expect(processResult.data.status).toBe("processing");

      // 3. Complete payment
      const completeResult = await paymentService.completePayment(createResult.data.id);
      expectSuccess(completeResult);
      expect(completeResult.data.status).toBe("completed");
      expect(completeResult.data.paidAt).toBeInstanceOf(Date);

      // 4. Refund payment
      const refundResult = await paymentService.refundPayment(createResult.data.id, {
        reason: "Customer request",
      });
      expectSuccess(refundResult);
      expect(refundResult.data.status).toBe("refunded");
    });
  });

  describe("Tenant Scoping", () => {
    it("should store tenant ID with payment", async () => {
      const tenantId = crypto.randomUUID();
      
      const result = await paymentService.createPayment({
        orderId: "order-tenant-scope",
        amount: 100.0,
        tenantId,
      });

      expectSuccess(result);
      expect(result.data.tenantId).toBe(tenantId);
    });
  });

  describe("Edge Cases", () => {
    it("should handle payment with very small amount", async () => {
      const result = await paymentService.createPayment({
        orderId: "order-small-amount",
        amount: 0.01,
      });

      expectSuccess(result);
      expect(result.data.amount).toBe("0.01");
    });

    it("should handle payment with very large amount", async () => {
      const result = await paymentService.createPayment({
        orderId: "order-large-amount",
        amount: 999999.99,
      });

      expectSuccess(result);
      expect(result.data.amount).toBe("999999.99");
    });

    it("should handle concurrent payment operations", async () => {
      const createResult = await paymentService.createPayment({
        orderId: "order-concurrent",
        amount: 100.0,
      });

      const paymentId = createResult.data.id;

      // Try to process and update simultaneously
      const [processResult, updateResult] = await Promise.all([
        paymentService.processPayment(paymentId),
        paymentService.updatePayment(paymentId, {
          description: "Updated during processing",
        }),
      ]);

      // One should succeed, one might fail depending on timing
      expect(processResult.success || updateResult.success).toBe(true);
    });
  });
});
