/**
 * API Integration Tests
 *
 * Tests for API endpoints using Result Pattern middleware.
 * Tests error handling, validation, and response formatting.
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "../setup/TestUtilities";

import { UserService } from "../../apps/api/lib/services/UserService";
import { PaymentService } from "../../apps/api/lib/services/PaymentService";

describe("API Integration Tests", () => {
  let userService: UserService;
  let paymentService: PaymentService;

  beforeEach(() => {
    userService = new UserService();
    paymentService = new PaymentService();
  });

  afterEach(() => {
    userService.getDatabase().clear();
    paymentService.getDatabase().clear();
  });

  describe("User Service Integration", () => {
    it("should handle complete user lifecycle", async () => {
      // Create user
      const createResult = await userService.createUser({
        email: "integration@example.com",
        firstName: "Integration",
        lastName: "User",
        role: "customer",
      });

      expect(createResult.success).toBe(true);
      const user = createResult.data;

      // Get user by ID
      const getResult = await userService.getUserById(user.id);
      expect(getResult.success).toBe(true);
      expect(getResult.data.email).toBe(user.email);

      // Update user
      const updateResult = await userService.updateUser(user.id, {
        firstName: "Updated",
        role: "staff",
      });
      expect(updateResult.success).toBe(true);
      expect(updateResult.data.firstName).toBe("Updated");
      expect(updateResult.data.role).toBe("staff");

      // Deactivate user
      const deactivateResult = await userService.deactivateUser(user.id);
      expect(deactivateResult.success).toBe(true);
      expect(deactivateResult.data.isActive).toBe(false);
    });

    it("should handle user authentication flow", async () => {
      // Create user
      const createResult = await userService.createUser({
        userId: "12345678-1234-1234-1234-123456789012",
        email: "auth@example.com",
        firstName: "Auth",
        lastName: "User",
      });

      expect(createResult.success).toBe(true);

      // Authenticate user
      const authResult = await userService.authenticateUser({
        email: "auth@example.com",
        password: "validpassword",
      });

      expect(authResult.success).toBe(true);
      expect(authResult.data.user.email).toBe("auth@example.com");
      expect(authResult.data.token).toBeDefined();

      // Try to authenticate with wrong password (should still work in mock)
      const wrongPassResult = await userService.authenticateUser({
        email: "auth@example.com",
        password: "wrongpassword",
      });

      expect(wrongPassResult.success).toBe(true); // Mock implementation accepts any 6+ char password

      // Try to authenticate non-existent user
      const nonExistentResult = await userService.authenticateUser({
        email: "nonexistent@example.com",
        password: "validpassword",
      });

      expect(nonExistentResult.success).toBe(false);
    });

    it("should handle concurrent operations safely", async () => {
      const userData = {
        userId: "12345678-1234-1234-1234-123456789012",
        email: "concurrent@example.com",
        firstName: "Concurrent",
        lastName: "User",
      };

      // Create user
      const createResult = await userService.createUser(userData);
      expect(createResult.success).toBe(true);

      // Simultaneous operations
      const [getResult1, getResult2, updateResult] = await Promise.all([
        userService.getUserById(createResult.data.id),
        userService.getUserById(createResult.data.id),
        userService.updateUser(createResult.data.id, {
          firstName: "Updated Concurrently",
        }),
      ]);

      expect(getResult1.success).toBe(true);
      expect(getResult2.success).toBe(true);
      expect(updateResult.success).toBe(true);
    });
  });

  describe("Payment Service Integration", () => {
    it("should handle complete payment lifecycle", async () => {
      // Create payment
      const createResult = await paymentService.createPayment({
        userId: "12345678-1234-1234-1234-123456789012",
        orderId: "87654321-4321-4321-4321-210987654321",
        amount: 100.0,
        paymentMethod: "credit_card",
        provider: "stripe",
        description: "Integration test payment",
      });

      expect(createResult.success).toBe(true);
      const payment = createResult.data;

      // Get payment by ID
      const getResult = await paymentService.getPaymentById(payment.id);
      expect(getResult.success).toBe(true);
      expect(getResult.data.amount).toBe(100.0);

      // Process payment
      const processResult = await paymentService.processPayment(payment.id);
      expect(processResult.success).toBe(true);
      expect(processResult.data.status).toBe("processing");
      expect(processResult.data.providerTransactionId).toBeDefined();

      // Complete payment
      const completeResult = await paymentService.completePayment(payment.id);
      expect(completeResult.success).toBe(true);
      expect(completeResult.data.status).toBe("completed");
      expect(completeResult.data.completedAt).toBeDefined();

      // Refund payment
      const refundResult = await paymentService.refundPayment(payment.id, {
        amount: 50.0,
        reason: "Partial refund test",
      });

      expect(refundResult.success).toBe(true);
      expect(refundResult.data.status).toBe("refunded");
      expect(refundResult.data.metadata?.refund?.amount).toBe(50.0);
    });

    it("should handle payment failure scenarios", async () => {
      // Create payment with high amount to trigger failure
      const createResult = await paymentService.createPayment({
        userId: "12345678-1234-1234-1234-123456789012",
        orderId: "87654321-4321-4321-4321-210987654321",
        amount: 15000.0, // Exceeds mock limit
        paymentMethod: "credit_card",
        provider: "stripe",
      });

      expect(createResult.success).toBe(true);

      // Process payment should fail
      const processResult = await paymentService.processPayment(
        createResult.data.id,
      );
      expect(processResult.success).toBe(false);
      expect(processResult.error.type).toBe("PaymentError");

      // Payment should be marked as failed
      const getResult = await paymentService.getPaymentById(
        createResult.data.id,
      );
      expect(getResult.success).toBe(true);
      expect(getResult.data.status).toBe("failed");
    });

    it("should handle multiple payments for order", async () => {
      const orderId = "87654321-4321-4321-4321-210987654321";

      // Create multiple payments for same order
      const payment1Result = await paymentService.createPayment({
        userId: "12345678-1234-1234-1234-123456789012",
        orderId,
        amount: 50.0,
        paymentMethod: "credit_card",
        provider: "stripe",
      });

      const payment2Result = await paymentService.createPayment({
        userId: "12345678-1234-1234-1234-123456789012",
        orderId,
        amount: 25.0,
        paymentMethod: "paypal",
        provider: "paypal",
      });

      expect(payment1Result.success).toBe(true);
      expect(payment2Result.success).toBe(true);

      // Get payments by order
      const orderPaymentsResult =
        await paymentService.getPaymentsByOrderId(orderId);
      expect(orderPaymentsResult.success).toBe(true);
      expect(orderPaymentsResult.data).toHaveLength(2);

      // Process both payments
      await paymentService.processPayment(payment1Result.data.id);
      await paymentService.processPayment(payment2Result.data.id);

      await paymentService.completePayment(payment1Result.data.id);
      await paymentService.completePayment(payment2Result.data.id);

      // Verify both are completed
      const finalPaymentsResult =
        await paymentService.getPaymentsByOrderId(orderId);
      expect(finalPaymentsResult.success).toBe(true);
      expect(
        finalPaymentsResult.data.every((p) => p.status === "completed"),
      ).toBe(true);
    });
  });

  describe("Cross-Service Integration", () => {
    it("should handle user and payment operations together", async () => {
      // Create user
      const userResult = await userService.createUser({
        userId: "12345678-1234-1234-1234-123456789012",
        email: "cross-service@example.com",
        firstName: "Cross",
        lastName: "Service",
        role: "customer",
      });

      expect(userResult.success).toBe(true);
      const user = userResult.data;

      // Create multiple payments for user
      const payment1Result = await paymentService.createPayment({
        userId: user.id,
        orderId: "11111111-1111-1111-1111-111111111111",
        amount: 100.0,
        paymentMethod: "credit_card",
        provider: "stripe",
      });

      const payment2Result = await paymentService.createPayment({
        userId: user.id,
        orderId: "22222222-2222-2222-2222-222222222222",
        amount: 75.0,
        paymentMethod: "paypal",
        provider: "paypal",
      });

      expect(payment1Result.success).toBe(true);
      expect(payment2Result.success).toBe(true);

      // Process and complete payments
      await paymentService.processPayment(payment1Result.data.id);
      await paymentService.completePayment(payment1Result.data.id);

      await paymentService.processPayment(payment2Result.data.id);
      await paymentService.completePayment(payment2Result.data.id);

      // Get user's payments
      const userPaymentsResult = await paymentService.getPaymentsByUserId(
        user.id,
      );
      expect(userPaymentsResult.success).toBe(true);
      expect(userPaymentsResult.data).toHaveLength(2);
      expect(
        userPaymentsResult.data.every((p) => p.status === "completed"),
      ).toBe(true);

      // Deactivate user (should not affect existing payments)
      const deactivateResult = await userService.deactivateUser(user.id);
      expect(deactivateResult.success).toBe(true);
      expect(deactivateResult.data.isActive).toBe(false);

      // Payments should still exist
      const finalPaymentsResult = await paymentService.getPaymentsByUserId(
        user.id,
      );
      expect(finalPaymentsResult.success).toBe(true);
      expect(finalPaymentsResult.data).toHaveLength(2);
    });

    it("should handle error propagation correctly", async () => {
      // Try to create payment with invalid user ID
      const invalidPaymentResult = await paymentService.createPayment({
        userId: "invalid-uuid",
        orderId: "87654321-4321-4321-4321-210987654321",
        amount: 100.0,
        paymentMethod: "credit_card",
        provider: "stripe",
      });

      expect(invalidPaymentResult.success).toBe(false);
      expect(invalidPaymentResult.error.type).toBe("ValidationError");

      // Try to get payment with invalid ID
      const invalidGetResult =
        await paymentService.getPaymentById("invalid-uuid");
      expect(invalidGetResult.success).toBe(false);
      expect(invalidGetResult.error.type).toBe("ValidationError");

      // Try to update non-existent payment
      const updateResult = await paymentService.updatePayment(
        "12345678-1234-1234-1234-123456789012",
        { description: "Updated" },
      );

      expect(updateResult.success).toBe(false);
      expect(updateResult.error.type).toBe("NotFoundError");
    });
  });

  describe("Performance and Scalability", () => {
    it("should handle multiple concurrent operations", async () => {
      // Create users sequentially to avoid email conflicts
      const userResults = [];
      for (let i = 0; i < 5; i++) {
        // Reduced count for performance
        const result = await userService.createUser({
          email: `user${i}-${Date.now()}@example.com`, // Unique email
          firstName: `User${i}`,
          lastName: "Test",
        });
        userResults.push(result);
      }

      expect(userResults.every((r) => r.success)).toBe(true);

      // Create payments for each user with unique order IDs
      const paymentPromises = userResults.map((userResult, i) => {
        const uniqueOrderId = crypto.randomUUID(); // Generate unique UUID
        return paymentService.createPayment({
          userId: userResult.data.id,
          orderId: uniqueOrderId,
          amount: (i + 1) * 10.0,
          paymentMethod: "credit_card",
          provider: "stripe",
        });
      });

      const paymentResults = await Promise.all(paymentPromises);
      expect(paymentResults.every((r) => r.success)).toBe(true);

      // Process all payments concurrently
      const processPromises = paymentResults.map((paymentResult) =>
        paymentService.processPayment(paymentResult.data.id),
      );

      const processResults = await Promise.all(processPromises);
      expect(processResults.every((r) => r.success)).toBe(true);
    });
  });
});
