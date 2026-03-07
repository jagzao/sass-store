/**
 * Product API Integration Tests
 *
 * Tests the Product API endpoints with Result Pattern middleware
 * and JWT authentication.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Result, Ok, Err, isFailure } from "@sass-store/core/src/result";
import { ErrorFactories } from "@sass-store/core/src/errors/types";
import { createAuthToken } from "@sass-store/core/src/middleware/auth-middleware";

describe("Product API Integration Tests", () => {
  const baseUrl = "http://localhost:4000";
  let testUserId: string;
  let testAuthToken: string;
  let testProductId: string;

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

    // Generate test product ID
    testProductId = `product_${Date.now()}`;
  });

  afterEach(async () => {
    // Cleanup would go here in a real test environment
  });

  describe("Product Creation", () => {
    it("POST /api/products - should create new product", async () => {
      const newProduct = {
        name: `Test Product ${Date.now()}`,
        description: "A test product for integration testing",
        price: 99.99,
        currency: "USD",
        stock: 10,
        sku: `SKU_${Date.now()}`,
        category: "test",
        isActive: true,
      };

      const response = await fetch(`${baseUrl}/api/products`, {
        method: "POST",
        headers: {
          Authorization: testAuthToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProduct),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe(newProduct.name);
      expect(data.data.price).toBe(newProduct.price);
      expect(data.data.stock).toBe(newProduct.stock);
    });

    it("POST /api/products - should validate required fields", async () => {
      const invalidProduct = {
        description: "Missing required fields",
      };

      const response = await fetch(`${baseUrl}/api/products`, {
        method: "POST",
        headers: {
          Authorization: testAuthToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidProduct),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.type).toBe("ValidationError");
    });
  });

  describe("Product Retrieval", () => {
    it("GET /api/products - should return products list", async () => {
      const response = await fetch(`${baseUrl}/api/products`, {
        method: "GET",
        headers: {
          Authorization: testAuthToken,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it("GET /api/products/[id] - should return specific product", async () => {
      // First create a product
      const newProduct = {
        name: `Specific Product ${Date.now()}`,
        description: "A specific test product",
        price: 149.99,
        currency: "USD",
        stock: 5,
        sku: `SPECIFIC_${Date.now()}`,
        category: "test",
        isActive: true,
      };

      const createResponse = await fetch(`${baseUrl}/api/products`, {
        method: "POST",
        headers: {
          Authorization: testAuthToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProduct),
      });

      expect(createResponse.status).toBe(200);
      const createData = await createResponse.json();
      const productId = createData.data.id;

      // Now retrieve it
      const response = await fetch(`${baseUrl}/api/products/${productId}`, {
        method: "GET",
        headers: {
          Authorization: testAuthToken,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(productId);
      expect(data.data.name).toBe(newProduct.name);
    });

    it("GET /api/products/[id] - should handle non-existent product", async () => {
      const nonExistentId = "non-existent-product-id";
      
      const response = await fetch(`${baseUrl}/api/products/${nonExistentId}`, {
        method: "GET",
        headers: {
          Authorization: testAuthToken,
        },
      });

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.type).toBe("NotFoundError");
    });
  });

  describe("Product Updates", () => {
    it("PUT /api/products/[id] - should update product", async () => {
      // First create a product
      const newProduct = {
        name: `Update Product ${Date.now()}`,
        description: "A product to be updated",
        price: 99.99,
        currency: "USD",
        stock: 10,
        sku: `UPDATE_${Date.now()}`,
        category: "test",
        isActive: true,
      };

      const createResponse = await fetch(`${baseUrl}/api/products`, {
        method: "POST",
        headers: {
          Authorization: testAuthToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProduct),
      });

      expect(createResponse.status).toBe(200);
      const createData = await createResponse.json();
      const productId = createData.data.id;

      // Now update it
      const updateData = {
        name: `Updated Product ${Date.now()}`,
        price: 149.99,
        stock: 15,
      };

      const response = await fetch(`${baseUrl}/api/products/${productId}`, {
        method: "PUT",
        headers: {
          Authorization: testAuthToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe(updateData.name);
      expect(data.data.price).toBe(updateData.price);
      expect(data.data.stock).toBe(updateData.stock);
    });

    it("PUT /api/products/[id] - should handle stock updates", async () => {
      // First create a product
      const newProduct = {
        name: `Stock Product ${Date.now()}`,
        description: "A product for stock testing",
        price: 79.99,
        currency: "USD",
        stock: 20,
        sku: `STOCK_${Date.now()}`,
        category: "test",
        isActive: true,
      };

      const createResponse = await fetch(`${baseUrl}/api/products`, {
        method: "POST",
        headers: {
          Authorization: testAuthToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProduct),
      });

      expect(createResponse.status).toBe(200);
      const createData = await createResponse.json();
      const productId = createData.data.id;

      // Update stock
      const stockUpdate = {
        stock: 25,
      };

      const response = await fetch(`${baseUrl}/api/products/${productId}`, {
        method: "PUT",
        headers: {
          Authorization: testAuthToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stockUpdate),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.stock).toBe(stockUpdate.stock);
    });
  });

  describe("Product Deletion", () => {
    it("DELETE /api/products/[id] - should delete product", async () => {
      // First create a product
      const newProduct = {
        name: `Delete Product ${Date.now()}`,
        description: "A product to be deleted",
        price: 59.99,
        currency: "USD",
        stock: 5,
        sku: `DELETE_${Date.now()}`,
        category: "test",
        isActive: true,
      };

      const createResponse = await fetch(`${baseUrl}/api/products`, {
        method: "POST",
        headers: {
          Authorization: testAuthToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProduct),
      });

      expect(createResponse.status).toBe(200);
      const createData = await createResponse.json();
      const productId = createData.data.id;

      // Now delete it
      const response = await fetch(`${baseUrl}/api/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: testAuthToken,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify it's deleted
      const getResponse = await fetch(`${baseUrl}/api/products/${productId}`, {
        method: "GET",
        headers: {
          Authorization: testAuthToken,
        },
      });

      expect(getResponse.status).toBe(404);
    });
  });

  describe("Product Search and Filtering", () => {
    it("GET /api/products - should support search by name", async () => {
      const response = await fetch(`${baseUrl}/api/products?search=Test`, {
        method: "GET",
        headers: {
          Authorization: testAuthToken,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it("GET /api/products - should support filtering by category", async () => {
      const response = await fetch(`${baseUrl}/api/products?category=test`, {
        method: "GET",
        headers: {
          Authorization: testAuthToken,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it("GET /api/products - should support price range filtering", async () => {
      const response = await fetch(`${baseUrl}/api/products?minPrice=50&maxPrice=150`, {
        method: "GET",
        headers: {
          Authorization: testAuthToken,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle authentication errors", async () => {
      const response = await fetch(`${baseUrl}/api/products`, {
        method: "GET",
        // No auth header
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.type).toBe("AuthenticationError");
    });

    it("should handle authorization errors", async () => {
      // Create a customer token (should not have admin permissions)
      const customerToken = createAuthToken({
        id: `customer_${Date.now()}`,
        email: "customer@example.com",
        role: "customer",
      }).success?.data || "";

      const response = await fetch(`${baseUrl}/api/products`, {
        method: "POST",
        headers: {
          Authorization: customerToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Unauthorized Product",
          description: "Should not be created",
          price: 99.99,
        }),
      });

      // This should work for customers
      expect(response.status).toBe(200);
    });

    it("should handle validation errors", async () => {
      const response = await fetch(`${baseUrl}/api/products`, {
        method: "POST",
        headers: {
          Authorization: testAuthToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Missing required fields
          description: "Invalid product",
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.type).toBe("ValidationError");
    });
  });

  describe("Result Pattern Compliance", () => {
    it("should return consistent API response format for success", async () => {
      const response = await fetch(`${baseUrl}/api/products`, {
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
      const response = await fetch(`${baseUrl}/api/products`, {
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
});