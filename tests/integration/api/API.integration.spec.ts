/**
 * API Integration Tests
 *
 * Tests the complete API surface with Result Pattern middleware
 * and JWT authentication.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Result, Ok, Err, isFailure } from "@sass-store/core/src/result";
import { ErrorFactories } from "@sass-store/core/src/errors/types";
import { createAuthToken } from "@sass-store/core/src/middleware/auth-middleware";

describe("API Integration Tests", () => {
  const baseUrl = "http://localhost:4000";
  let testUserId: string;
  let testAuthToken: string;
  let testPaymentId: string;
  let testCartId: string;

  beforeEach(async () => {
    // Create test user and get auth token
    testUserId = `user_${Date.now()}`;

    const tokenResult = createAuthToken({
      id: testUserId,
      email: "test@example.com",
      role: "customer",
    });

    expect(tokenResult.success).toBe(true);
    testAuthToken = tokenResult.success ? tokenResult.data : "";

    // Generate test IDs
    testPaymentId = `payment_${Date.now()}`;
    testCartId = `cart_${Date.now()}`;
  });

  afterEach(async () => {
    // Cleanup would go here in a real test environment
  });

  describe("Authentication Endpoints", () => {
    it("POST /api/auth/login - should authenticate valid credentials", async () => {
      const response = await fetch(`${baseUrl}/api/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "testpassword",
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe("test@example.com");
      expect(data.data.token).toMatch(/^Bearer .+/);
    });

    it("POST /api/auth/login - should reject invalid credentials", async () => {
      const response = await fetch(`${baseUrl}/api/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "invalid@example.com",
          password: "wrongpassword",
        }),
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.type).toBe("AuthenticationError");
    });

    it("GET /api/auth/me - should return current user with valid token", async () => {
      const response = await fetch(`${baseUrl}/api/auth/me`, {
        method: "GET",
        headers: {
          Authorization: testAuthToken,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.email).toBe("test@example.com");
    });

    it("GET /api/auth/me - should reject requests without token", async () => {
      const response = await fetch(`${baseUrl}/api/auth/me`, {
        method: "GET",
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.type).toBe("AuthenticationError");
    });
  });

  describe("Users API", () => {
    it("GET /api/users - should return users for authenticated admin", async () => {
      const adminToken =
        createAuthToken({
          id: `admin_${Date.now()}`,
          email: "admin@example.com",
          role: "admin",
        }).success?.data || "";

      const response = await fetch(`${baseUrl}/api/users`, {
        method: "GET",
        headers: {
          Authorization: adminToken,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it("POST /api/users - should create new user", async () => {
      const newUser = {
        email: `newuser${Date.now()}@example.com`,
        firstName: "Test",
        lastName: "User",
        role: "customer" as const,
      };

      const response = await fetch(`${baseUrl}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.email).toBe(newUser.email);
      expect(data.data.firstName).toBe(newUser.firstName);
    });
  });

  describe("Payments API", () => {
    it("GET /api/payments - should return payments for authenticated user", async () => {
      const response = await fetch(
        `${baseUrl}/api/payments?userId=${testUserId}`,
        {
          method: "GET",
          headers: {
            Authorization: testAuthToken,
          },
        },
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it("POST /api/payments - should create new payment", async () => {
      const newPayment = {
        userId: testUserId,
        orderId: `order_${Date.now()}`,
        amount: 99.99,
        currency: "USD",
        paymentMethod: "credit_card" as const,
        provider: "stripe" as const,
        description: "Test payment",
      };

      const response = await fetch(`${baseUrl}/api/payments`, {
        method: "POST",
        headers: {
          Authorization: testAuthToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPayment),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.amount).toBe(newPayment.amount);
      expect(data.data.status).toBe("pending");
    });

    it("PUT /api/payments - should update payment status", async () => {
      const updateData = {
        status: "completed" as const,
        providerTransactionId: `txn_${Date.now()}`,
      };

      const response = await fetch(
        `${baseUrl}/api/payments?paymentId=${testPaymentId}`,
        {
          method: "PUT",
          headers: {
            Authorization: testAuthToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        },
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe(updateData.status);
    });

    it("POST /api/payments/[id]/refund - should refund payment", async () => {
      const refundData = {
        reason: "Customer requested refund",
        amount: 50.0,
      };

      const response = await fetch(
        `${baseUrl}/api/payments/${testPaymentId}/refund`,
        {
          method: "POST",
          headers: {
            Authorization: testAuthToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(refundData),
        },
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe("Cart API", () => {
    it("GET /api/cart - should return user's cart", async () => {
      const response = await fetch(`${baseUrl}/api/cart`, {
        method: "GET",
        headers: {
          Authorization: testAuthToken,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.userId).toBe(testUserId);
      expect(data.data.status).toBe("active");
    });

    it("POST /api/cart - should add item to cart", async () => {
      const newItem = {
        productId: `product_${Date.now()}`,
        quantity: 2,
      };

      const response = await fetch(`${baseUrl}/api/cart`, {
        method: "POST",
        headers: {
          Authorization: testAuthToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newItem),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("PUT /api/cart - should update cart item", async () => {
      const updateData = {
        quantity: 5,
      };

      const response = await fetch(
        `${baseUrl}/api/cart?itemId=item_${Date.now()}`,
        {
          method: "PUT",
          headers: {
            Authorization: testAuthToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        },
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("DELETE /api/cart - should remove item from cart", async () => {
      const response = await fetch(
        `${baseUrl}/api/cart?itemId=item_${Date.now()}`,
        {
          method: "DELETE",
          headers: {
            Authorization: testAuthToken,
          },
        },
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle validation errors consistently", async () => {
      const response = await fetch(`${baseUrl}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "invalid-email",
          firstName: "",
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.type).toBe("ValidationError");
    });

    it("should handle authorization errors consistently", async () => {
      const customerToken =
        createAuthToken({
          id: `customer_${Date.now()}`,
          email: "customer@example.com",
          role: "customer",
        }).success?.data || "";

      // Try to access admin-only endpoint as customer
      const response = await fetch(`${baseUrl}/api/users`, {
        method: "GET",
        headers: {
          Authorization: customerToken,
        },
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.type).toBe("AuthorizationError");
    });

    it("should handle authentication errors consistently", async () => {
      const response = await fetch(`${baseUrl}/api/cart`, {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.type).toBe("AuthenticationError");
    });
  });

  describe("Result Pattern Compliance", () => {
    it("should return consistent API response format", async () => {
      const response = await fetch(`${baseUrl}/api/auth/me`, {
        method: "GET",
        headers: {
          Authorization: testAuthToken,
        },
      });

      const data = await response.json();

      // Check success response structure
      expect(data).toHaveProperty("success");
      expect(data).toHaveProperty("data");
      expect(data).toHaveProperty("meta");
      expect(data.meta).toHaveProperty("timestamp");
      expect(data.meta).toHaveProperty("requestId");
    });

    it("should return consistent error response format", async () => {
      const response = await fetch(`${baseUrl}/api/cart`, {
        method: "GET",
        // No auth header to trigger error
      });

      const data = await response.json();

      // Check error response structure
      expect(data).toHaveProperty("success", false);
      expect(data).toHaveProperty("error");
      expect(data.error).toHaveProperty("message");
      expect(data.error).toHaveProperty("type");
      expect(data).toHaveProperty("meta");
    });
  });

  describe("Cross-Service Integration", () => {
    it("should handle complete user journey", async () => {
      // 1. Register user
      const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: `journey${Date.now()}@example.com`,
          password: "password123",
          firstName: "Journey",
          lastName: "User",
          role: "customer" as const,
        }),
      });

      expect(registerResponse.status).toBe(200);
      const registerData = await registerResponse.json();
      expect(registerData.success).toBe(true);

      const userToken = registerData.data.token;

      // 2. Add items to cart
      const cartResponse = await fetch(`${baseUrl}/api/cart`, {
        method: "POST",
        headers: {
          Authorization: userToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: `product_${Date.now()}`,
          quantity: 2,
        }),
      });

      expect(cartResponse.status).toBe(200);
      const cartData = await cartResponse.json();
      expect(cartData.success).toBe(true);

      // 3. Create payment
      const paymentResponse = await fetch(`${baseUrl}/api/payments`, {
        method: "POST",
        headers: {
          Authorization: userToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: registerData.data.user.id,
          orderId: `order_${Date.now()}`,
          amount: 199.99,
          currency: "USD",
          paymentMethod: "credit_card" as const,
          provider: "stripe" as const,
        }),
      });

      expect(paymentResponse.status).toBe(200);
      const paymentData = await paymentResponse.json();
      expect(paymentData.success).toBe(true);

      // 4. Verify user info
      const userResponse = await fetch(`${baseUrl}/api/auth/me`, {
        method: "GET",
        headers: {
          Authorization: userToken,
        },
      });

      expect(userResponse.status).toBe(200);
      const userData = await userResponse.json();
      expect(userData.success).toBe(true);
      expect(userData.data.email).toBe(registerData.data.user.email);
    });
  });
});
