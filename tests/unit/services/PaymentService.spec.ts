/**
 * Payment Service Tests
 *
 * Comprehensive tests for payment processing and management using Result Pattern.
 * Tests all major payment operations with proper error handling.
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "../../setup/TestUtilities";

import {
  PaymentService,
  Payment,
  CreatePaymentData,
  UpdatePaymentData,
  RefundData,
} from "../../../apps/api/lib/services/PaymentService";
import { expectSuccess, expectFailure } from "../../setup/TestUtilities";

describe("PaymentService", () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    paymentService = new PaymentService();
  });

  afterEach(() => {
    // Clear database after each test
    paymentService.getDatabase().clear();
  });

  describe("createPayment", () => {
    const validPaymentData: CreatePaymentData = {
      userId: "12345678-1234-1234-1234-123456789012",
      orderId: "87654321-4321-4321-4321-210987654321",
      amount: 100.0,
      currency: "USD",
      paymentMethod: "credit_card",
      provider: "stripe",
      description: "Test payment",
    };

    it("should create a payment with valid data", async () => {
      const result = await paymentService.createPayment(validPaymentData);

      expectSuccess(result);
      expect(result.data).toMatchObject({
        userId: validPaymentData.userId,
        orderId: validPaymentData.orderId,
        amount: validPaymentData.amount,
        currency: validPaymentData.currency,
        status: "pending",
        paymentMethod: validPaymentData.paymentMethod,
        provider: validPaymentData.provider,
        description: validPaymentData.description,
      });
      expect(result.data.id).toBeDefined();
      expect(result.data.createdAt).toBeInstanceOf(Date);
      expect(result.data.updatedAt).toBeInstanceOf(Date);
    });

    it("should create a payment with default currency", async () => {
      const paymentDataWithoutCurrency = {
        userId: "12345678-1234-1234-1234-123456789012",
        orderId: "87654321-4321-4321-4321-210987654321",
        amount: 50.0,
        paymentMethod: "paypal" as const,
        provider: "paypal" as const,
      };

      const result = await paymentService.createPayment(
        paymentDataWithoutCurrency,
      );

      expectSuccess(result);
      expect(result.data.currency).toBe("USD");
    });

    it("should return validation error for negative amount", async () => {
      const invalidData = {
        userId: "12345678-1234-1234-1234-123456789012",
        orderId: "87654321-4321-4321-4321-210987654321",
        amount: -10.0,
        paymentMethod: "credit_card" as const,
        provider: "stripe" as const,
      };

      const result = await paymentService.createPayment(invalidData);

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });

    it("should return validation error for invalid user ID", async () => {
      const invalidData = {
        userId: "invalid-uuid",
        orderId: "87654321-4321-4321-4321-210987654321",
        amount: 100.0,
        paymentMethod: "credit_card" as const,
        provider: "stripe" as const,
      };

      const result = await paymentService.createPayment(invalidData);

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });

    it("should return validation error for invalid order ID", async () => {
      const invalidData = {
        userId: "12345678-1234-1234-1234-123456789012",
        orderId: "invalid-uuid",
        amount: 100.0,
        paymentMethod: "credit_card" as const,
        provider: "stripe" as const,
      };

      const result = await paymentService.createPayment(invalidData);

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });

    it("should create payment with metadata", async () => {
      const paymentDataWithMetadata = {
        ...validPaymentData,
        metadata: {
          customer_ip: "192.168.1.1",
          browser: "Chrome",
          device: "desktop",
        },
      };

      const result = await paymentService.createPayment(
        paymentDataWithMetadata,
      );

      expectSuccess(result);
      expect(result.data.metadata).toEqual(paymentDataWithMetadata.metadata);
    });

    it("should create payment with different payment methods", async () => {
      const paymentMethods: Payment["paymentMethod"][] = [
        "credit_card",
        "debit_card",
        "paypal",
        "stripe",
        "bank_transfer",
      ];

      for (const method of paymentMethods) {
        const paymentData = {
          ...validPaymentData,
          paymentMethod: method,
          orderId: `${crypto.randomUUID()}`, // Ensure unique order ID
        };

        const result = await paymentService.createPayment(paymentData);

        expectSuccess(result);
        expect(result.data.paymentMethod).toBe(method);
      }
    });
  });

  describe("getPaymentById", () => {
    let testPayment: Payment;

    beforeEach(async () => {
      const createResult = await paymentService.createPayment({
        userId: "12345678-1234-1234-1234-123456789012",
        orderId: "87654321-4321-4321-4321-210987654321",
        amount: 100.0,
        paymentMethod: "credit_card",
        provider: "stripe",
      });
      testPayment = createResult.data;
    });

    it("should return payment for valid ID", async () => {
      const result = await paymentService.getPaymentById(testPayment.id);

      expectSuccess(result);
      expect(result.data).toMatchObject({
        id: testPayment.id,
        userId: testPayment.userId,
        orderId: testPayment.orderId,
        amount: testPayment.amount,
      });
    });

    it("should return not found error for non-existent ID", async () => {
      const result = await paymentService.getPaymentById(
        "12345678-1234-1234-1234-123456789012",
      );

      expectFailure(result);
      expect(result.error.type).toBe("NotFoundError");
      expect(result.error.resource).toBe("Payment");
    });

    it("should return validation error for invalid UUID", async () => {
      const result = await paymentService.getPaymentById("invalid-uuid");

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });
  });

  describe("getPaymentsByOrderId", () => {
    const testOrderId = "87654321-4321-4321-4321-210987654321";

    beforeEach(async () => {
      // Create multiple payments for the same order
      await paymentService.createPayment({
        userId: "12345678-1234-1234-1234-123456789012",
        orderId: testOrderId,
        amount: 50.0,
        paymentMethod: "credit_card",
        provider: "stripe",
      });

      await paymentService.createPayment({
        userId: "12345678-1234-1234-1234-123456789012",
        orderId: testOrderId,
        amount: 25.0,
        paymentMethod: "paypal",
        provider: "paypal",
      });

      // Create payment for different order
      await paymentService.createPayment({
        userId: "12345678-1234-1234-1234-123456789012",
        orderId: "11111111-1111-1111-1111-111111111111",
        amount: 75.0,
        paymentMethod: "debit_card",
        provider: "square",
      });
    });

    it("should return payments for valid order ID", async () => {
      const result = await paymentService.getPaymentsByOrderId(testOrderId);

      expectSuccess(result);
      expect(result.data).toHaveLength(2);
      expect(result.data.every((p) => p.orderId === testOrderId)).toBe(true);
    });

    it("should return empty array for order with no payments", async () => {
      const result = await paymentService.getPaymentsByOrderId(
        "22222222-2222-2222-2222-222222222222",
      );

      expectSuccess(result);
      expect(result.data).toEqual([]);
    });

    it("should return validation error for invalid order ID", async () => {
      const result = await paymentService.getPaymentsByOrderId("invalid-uuid");

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });
  });

  describe("getPaymentsByUserId", () => {
    const testUserId = "12345678-1234-1234-1234-123456789012";

    beforeEach(async () => {
      // Create multiple payments for the same user
      await paymentService.createPayment({
        userId: testUserId,
        orderId: "11111111-1111-1111-1111-111111111111",
        amount: 50.0,
        paymentMethod: "credit_card",
        provider: "stripe",
      });

      await paymentService.createPayment({
        userId: testUserId,
        orderId: "22222222-2222-2222-2222-222222222222",
        amount: 75.0,
        paymentMethod: "paypal",
        provider: "paypal",
      });

      // Create payment for different user
      await paymentService.createPayment({
        userId: "87654321-4321-4321-4321-210987654321",
        orderId: "33333333-3333-3333-3333-333333333333",
        amount: 25.0,
        paymentMethod: "debit_card",
        provider: "square",
      });
    });

    it("should return payments for valid user ID", async () => {
      const result = await paymentService.getPaymentsByUserId(testUserId);

      expectSuccess(result);
      expect(result.data).toHaveLength(2);
      expect(result.data.every((p) => p.userId === testUserId)).toBe(true);
    });

    it("should return empty array for user with no payments", async () => {
      const result = await paymentService.getPaymentsByUserId(
        "44444444-4444-4444-4444-444444444444",
      );

      expectSuccess(result);
      expect(result.data).toEqual([]);
    });

    it("should return validation error for invalid user ID", async () => {
      const result = await paymentService.getPaymentsByUserId("invalid-uuid");

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });
  });

  describe("processPayment", () => {
    let testPayment: Payment;

    beforeEach(async () => {
      const createResult = await paymentService.createPayment({
        userId: "12345678-1234-1234-1234-123456789012",
        orderId: "87654321-4321-4321-4321-210987654321",
        amount: 100.0,
        paymentMethod: "credit_card",
        provider: "stripe",
      });
      testPayment = createResult.data;
    });

    it("should process pending payment successfully", async () => {
      const result = await paymentService.processPayment(testPayment.id);

      expectSuccess(result);
      expect(result.data.status).toBe("processing");
      expect(result.data.providerTransactionId).toBeDefined();
      expect(result.data.updatedAt.getTime()).toBeGreaterThan(
        testPayment.updatedAt.getTime(),
      );
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
      expect(result.error.rule).toBe("payment_not_pending");
    });

    it("should return error for failed payment", async () => {
      // Create a payment with high amount to trigger failure
      const highAmountResult = await paymentService.createPayment({
        userId: "12345678-1234-1234-1234-123456789012",
        orderId: "99999999-9999-9999-9999-999999999999",
        amount: 15000.0, // Exceeds mock limit
        paymentMethod: "credit_card",
        provider: "stripe",
      });

      const result = await paymentService.processPayment(
        highAmountResult.data.id,
      );

      expectFailure(result);
      expect(result.error.type).toBe("PaymentError");
    });

    it("should return not found error for non-existent payment", async () => {
      const result = await paymentService.processPayment(
        "12345678-1234-1234-1234-123456789012",
      );

      expectFailure(result);
      expect(result.error.type).toBe("NotFoundError");
    });
  });

  describe("completePayment", () => {
    let testPayment: Payment;

    beforeEach(async () => {
      const createResult = await paymentService.createPayment({
        userId: "12345678-1234-1234-1234-123456789012",
        orderId: "87654321-4321-4321-4321-210987654321",
        amount: 100.0,
        paymentMethod: "credit_card",
        provider: "stripe",
      });
      testPayment = createResult.data;
    });

    it("should complete processing payment successfully", async () => {
      // Process payment first
      await paymentService.processPayment(testPayment.id);

      const result = await paymentService.completePayment(testPayment.id);

      expectSuccess(result);
      expect(result.data.status).toBe("completed");
      expect(result.data.completedAt).toBeInstanceOf(Date);
      expect(result.data.updatedAt.getTime()).toBeGreaterThan(
        testPayment.updatedAt.getTime(),
      );
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
      expect(result.error.rule).toBe("payment_not_processing");
    });
  });

  describe("refundPayment", () => {
    let testPayment: Payment;

    beforeEach(async () => {
      const createResult = await paymentService.createPayment({
        userId: "12345678-1234-1234-1234-123456789012",
        orderId: "87654321-4321-4321-4321-210987654321",
        amount: 100.0,
        paymentMethod: "credit_card",
        provider: "stripe",
      });
      testPayment = createResult.data;
    });

    it("should refund full payment amount successfully", async () => {
      // Process and complete payment
      await paymentService.processPayment(testPayment.id);
      await paymentService.completePayment(testPayment.id);

      const refundData: RefundData = {
        reason: "Customer requested refund",
      };

      const result = await paymentService.refundPayment(
        testPayment.id,
        refundData,
      );

      expectSuccess(result);
      expect(result.data.status).toBe("refunded");
      expect(result.data.metadata?.refund).toMatchObject({
        amount: 100.0,
        reason: "Customer requested refund",
      });
      expect(result.data.metadata?.refund?.transactionId).toBeDefined();
    });

    it("should refund partial payment amount successfully", async () => {
      // Process and complete payment
      await paymentService.processPayment(testPayment.id);
      await paymentService.completePayment(testPayment.id);

      const refundData: RefundData = {
        amount: 25.0,
        reason: "Partial refund",
      };

      const result = await paymentService.refundPayment(
        testPayment.id,
        refundData,
      );

      expectSuccess(result);
      expect(result.data.status).toBe("refunded");
      expect(result.data.metadata?.refund?.amount).toBe(25.0);
    });

    it("should return error for refund amount exceeding payment amount", async () => {
      // Process and complete payment
      await paymentService.processPayment(testPayment.id);
      await paymentService.completePayment(testPayment.id);

      const refundData: RefundData = {
        amount: 150.0, // More than original payment
        reason: "Excessive refund",
      };

      const result = await paymentService.refundPayment(
        testPayment.id,
        refundData,
      );

      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.rule).toBe("refund_amount_exceeds_payment");
    });

    it("should return error for refunding non-completed payment", async () => {
      const refundData: RefundData = {
        reason: "Refund pending payment",
      };

      const result = await paymentService.refundPayment(
        testPayment.id,
        refundData,
      );

      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.rule).toBe("payment_not_completed");
    });

    it("should return validation error for negative refund amount", async () => {
      // Process and complete payment
      await paymentService.processPayment(testPayment.id);
      await paymentService.completePayment(testPayment.id);

      const invalidRefundData: RefundData = {
        amount: -10.0,
        reason: "Negative refund",
      };

      const result = await paymentService.refundPayment(
        testPayment.id,
        invalidRefundData,
      );

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });
  });

  describe("updatePayment", () => {
    let testPayment: Payment;

    beforeEach(async () => {
      const createResult = await paymentService.createPayment({
        userId: "12345678-1234-1234-1234-123456789012",
        orderId: "87654321-4321-4321-4321-210987654321",
        amount: 100.0,
        paymentMethod: "credit_card",
        provider: "stripe",
      });
      testPayment = createResult.data;
    });

    it("should update payment description", async () => {
      const updateData: UpdatePaymentData = {
        description: "Updated payment description",
      };

      // Small delay to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 1));

      const result = await paymentService.updatePayment(
        testPayment.id,
        updateData,
      );

      expectSuccess(result);
      expect(result.data.description).toBe(updateData.description);
      expect(result.data.updatedAt.getTime()).toBeGreaterThan(
        testPayment.updatedAt.getTime(),
      );
    });

    it("should update payment metadata", async () => {
      const updateData: UpdatePaymentData = {
        metadata: {
          new_field: "new_value",
          another_field: 123,
        },
      };

      const result = await paymentService.updatePayment(
        testPayment.id,
        updateData,
      );

      expectSuccess(result);
      expect(result.data.metadata).toEqual(updateData.metadata);
    });

    it("should update multiple fields", async () => {
      const updateData: UpdatePaymentData = {
        description: "Updated description",
        providerTransactionId: "updated_txn_123",
        metadata: {
          updated: true,
        },
      };

      const result = await paymentService.updatePayment(
        testPayment.id,
        updateData,
      );

      expectSuccess(result);
      expect(result.data.description).toBe(updateData.description);
      expect(result.data.providerTransactionId).toBe(
        updateData.providerTransactionId,
      );
      expect(result.data.metadata).toEqual(updateData.metadata);
    });

    it("should return not found error for non-existent payment", async () => {
      const updateData: UpdatePaymentData = {
        description: "Updated description",
      };

      const result = await paymentService.updatePayment(
        "12345678-1234-1234-1234-123456789012",
        updateData,
      );

      expectFailure(result);
      expect(result.error.type).toBe("NotFoundError");
    });

    it("should return validation error for invalid payment ID", async () => {
      const updateData: UpdatePaymentData = {
        description: "Updated description",
      };

      const result = await paymentService.updatePayment(
        "invalid-uuid",
        updateData,
      );

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
        userId: "11111111-1111-1111-1111-111111111111",
        orderId: "11111111-1111-1111-1111-111111111111",
        amount: 50.0,
        paymentMethod: "credit_card",
        provider: "stripe",
      });

      await paymentService.createPayment({
        userId: "22222222-2222-2222-2222-222222222222",
        orderId: "22222222-2222-2222-2222-222222222222",
        amount: 75.0,
        paymentMethod: "paypal",
        provider: "paypal",
      });

      const result = await paymentService.getAllPayments();

      expectSuccess(result);
      expect(result.data).toHaveLength(2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle payment processing with different providers", async () => {
      const providers: Payment["provider"][] = [
        "stripe",
        "paypal",
        "square",
        "adhoc",
      ];

      for (const provider of providers) {
        const createResult = await paymentService.createPayment({
          userId: "12345678-1234-1234-1234-123456789012",
          orderId: crypto.randomUUID(),
          amount: 100.0,
          paymentMethod: "credit_card",
          provider,
        });

        const processResult = await paymentService.processPayment(
          createResult.data.id,
        );

        expectSuccess(processResult);
        expect(processResult.data.provider).toBe(provider);
      }
    });

    it("should handle concurrent payment operations", async () => {
      const createResult = await paymentService.createPayment({
        userId: "12345678-1234-1234-1234-123456789012",
        orderId: "87654321-4321-4321-4321-210987654321",
        amount: 100.0,
        paymentMethod: "credit_card",
        provider: "stripe",
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
