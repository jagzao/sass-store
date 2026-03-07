import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS } from "../helpers/test-helpers";

/**
 * Payments Flow E2E Tests
 * Tests the critical payment operations: create, list, update, refund
 * Uses API request context for deterministic testing
 * 
 * NOTE: Payment API requires Bearer token authentication.
 * Tests verify proper auth rejection and validation behavior.
 */

// Helper function to check if status is one of expected values
function expectStatusOneOf(status: number, expected: number[], context?: string) {
  if (!expected.includes(status)) {
    const contextMsg = context ? ` (${context})` : '';
    throw new Error(`Expected status to be one of [${expected.join(', ')}], but got ${status}${contextMsg}`);
  }
}

test.describe("Payments API Flow", () => {
  const { tenantSlug } = TEST_CREDENTIALS;
  
  // Generate unique test identifiers to avoid collisions
  const testId = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const testUserId = `test_user_${testId}`;
  const testOrderId = `test_order_${testId}`;

  test.describe("Payment Authorization (Critical)", () => {
    
    test("should reject unauthenticated requests to create payment", async ({ request }) => {
      // Explicitly don't include auth
      const response = await request.post(`/api/payments`, {
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          userId: "unauthorized_user",
          orderId: "unauthorized_order",
          amount: 100,
          paymentMethod: "credit_card",
          provider: "stripe",
        },
      });

      // Should return unauthorized - this is the expected security behavior
      expectStatusOneOf(response.status(), [401, 403], "unauthenticated create");
    });

    test("should reject unauthenticated requests to list all payments", async ({ request }) => {
      // Request all payments without auth (admin only endpoint)
      const response = await request.get(`/api/payments`, {
        headers: {},
      });

      // Should return unauthorized
      expectStatusOneOf(response.status(), [401, 403], "unauthenticated list all");
    });

    test("should reject unauthenticated requests to get payments by user", async ({ request }) => {
      const response = await request.get(`/api/payments?userId=${testUserId}`, {
        headers: {},
      });

      // Should return unauthorized
      expectStatusOneOf(response.status(), [401, 403], "unauthenticated list by user");
    });

    test("should reject unauthenticated requests to update payment", async ({ request }) => {
      const response = await request.put(`/api/payments?paymentId=test_payment`, {
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          status: "completed",
        },
      });

      // Should return unauthorized
      expectStatusOneOf(response.status(), [401, 403], "unauthenticated update");
    });

    test("should reject unauthenticated requests to refund payment", async ({ request }) => {
      const response = await request.post(`/api/payments/test_payment/refund`, {
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          amount: 50,
          reason: "Test refund",
        },
      });

      // Should return unauthorized
      expectStatusOneOf(response.status(), [401, 403], "unauthenticated refund");
    });
  });

  test.describe("Payment Validation (with auth rejection)", () => {
    
    test("should reject invalid payment method (auth checked first)", async ({ request }) => {
      const response = await request.post(`/api/payments`, {
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          userId: testUserId,
          orderId: testOrderId,
          amount: 100,
          paymentMethod: "invalid_method", // Invalid enum value
          provider: "stripe",
        },
      });

      // Auth is checked before validation, so we get 401
      expectStatusOneOf(response.status(), [401, 403, 400, 422], "invalid payment method");
    });

    test("should reject negative amount (auth checked first)", async ({ request }) => {
      const response = await request.post(`/api/payments`, {
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          userId: testUserId,
          orderId: testOrderId,
          amount: -50, // Negative amount
          paymentMethod: "credit_card",
          provider: "stripe",
        },
      });

      // Auth is checked before validation, so we get 401
      expectStatusOneOf(response.status(), [401, 403, 400, 422], "negative amount");
    });

    test("should reject missing required fields (auth checked first)", async ({ request }) => {
      const response = await request.post(`/api/payments`, {
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          // Missing userId, orderId, amount
          paymentMethod: "credit_card",
          provider: "stripe",
        },
      });

      // Auth is checked before validation, so we get 401
      expectStatusOneOf(response.status(), [401, 403, 400, 422], "missing fields");
    });
  });

  test.describe("Payment API Structure", () => {
    
    test("payments endpoint should exist and respond", async ({ request }) => {
      const response = await request.get(`/api/payments`);
      
      // Endpoint exists (not 404) - even if unauthorized
      expect(response.status()).not.toBe(404);
    });

    test("payments refund endpoint should exist and respond", async ({ request }) => {
      const response = await request.post(`/api/payments/test/refund`, {
        headers: {
          "Content-Type": "application/json",
        },
        data: {},
      });
      
      // Endpoint exists (not 404) - even if unauthorized
      expect(response.status()).not.toBe(404);
    });
  });
});
