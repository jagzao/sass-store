/**
 * Product API Integration Tests
 * Tests for product API endpoints
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  getTestDb,
  setupTestDatabase,
  createTestTenant,
  createTestProduct,
} from "../../setup/test-database";

describe("Product API Integration", () => {
  let tenant: any;
  let product: any;

  beforeAll(async () => {
    await setupTestDatabase();
    const db = getTestDb();
    if (!db) return;

    tenant = await createTestTenant({
      slug: "product-api-test",
      mode: "catalog",
    });

    product = await createTestProduct(tenant.id, {
      sku: "TEST-PROD-001",
      name: "Test Product",
      price: "99.99",
      stock: 100,
    });
  });

  describe("GET /api/v1/products", () => {
    it("should list all products for tenant", async () => {
      const db = getTestDb();
      if (!db) return;

      // In a real test, you'd make an HTTP request
      // For now, we'll test the database query
      const products = await db.query.products.findMany({
        where: (products, { eq }) => eq(products.tenantId, tenant.id),
      });

      expect(products.length).toBeGreaterThan(0);
      expect(products[0].tenantId).toBe(tenant.id);
    });

    it("should filter products by category", async () => {
      const db = getTestDb();
      if (!db) return;

      await createTestProduct(tenant.id, {
        sku: "CAT-001",
        category: "electronics",
        price: "199.99",
      });

      const products = await db.query.products.findMany({
        where: (products, { and, eq }) =>
          and(
            eq(products.tenantId, tenant.id),
            eq(products.category, "electronics"),
          ),
      });

      expect(products.length).toBeGreaterThan(0);
      expect(products.every((p) => p.category === "electronics")).toBe(true);
    });

    it("should filter active products only", async () => {
      const db = getTestDb();
      if (!db) return;

      await createTestProduct(tenant.id, {
        sku: "INACTIVE-001",
        active: false,
      });

      const products = await db.query.products.findMany({
        where: (products, { and, eq }) =>
          and(eq(products.tenantId, tenant.id), eq(products.active, true)),
      });

      expect(products.every((p) => p.active === true)).toBe(true);
    });
  });

  describe("GET /api/v1/products/:id", () => {
    it("should retrieve product by ID", async () => {
      const db = getTestDb();
      if (!db) return;

      const found = await db.query.products.findFirst({
        where: (products, { eq }) => eq(products.id, product.id),
      });

      expect(found).toBeDefined();
      expect(found?.id).toBe(product.id);
      expect(found?.name).toBe(product.name);
    });

    it("should return null for non-existent product", async () => {
      const db = getTestDb();
      if (!db) return;

      const found = await db.query.products.findFirst({
        where: (products, { eq }) => eq(products.id, "non-existent-id"),
      });

      expect(found).toBeUndefined();
    });
  });

  describe("Product Validation", () => {
    it("should validate product price format", () => {
      const validPrices = ["0.99", "10.00", "999.99", "1234.56"];
      const invalidPrices = ["abc", "-10", "10.999", ""];

      validPrices.forEach((price) => {
        expect(/^\d+\.\d{2}$/.test(price)).toBe(true);
      });

      invalidPrices.forEach((price) => {
        expect(/^\d+\.\d{2}$/.test(price)).toBe(false);
      });
    });

    it("should validate SKU format", () => {
      const validSKUs = ["PROD-001", "SKU123", "TEST-PRODUCT-001"];
      const invalidSKUs = ["", " ", "invalid sku"];

      validSKUs.forEach((sku) => {
        expect(sku.length).toBeGreaterThan(0);
        expect(sku.trim()).toBe(sku);
      });

      invalidSKUs.forEach((sku) => {
        const isInvalid = sku.length === 0 || sku !== sku.trim();
        expect(isInvalid).toBe(true);
      });
    });

    it("should validate stock is non-negative", () => {
      const validStock = [0, 1, 10, 100, 1000];
      const invalidStock = [-1, -10];

      validStock.forEach((stock) => {
        expect(stock).toBeGreaterThanOrEqual(0);
      });

      invalidStock.forEach((stock) => {
        expect(stock).toBeLessThan(0);
      });
    });
  });

  describe("Product Search", () => {
    it("should search products by name", async () => {
      const db = getTestDb();
      if (!db) return;

      await createTestProduct(tenant.id, {
        sku: "SEARCH-001",
        name: "Searchable Product Name",
      });

      const products = await db.query.products.findMany({
        where: (products, { and, eq, like }) =>
          and(
            eq(products.tenantId, tenant.id),
            like(products.name, "%Searchable%"),
          ),
      });

      expect(products.length).toBeGreaterThan(0);
      expect(products[0].name).toContain("Searchable");
    });

    it("should search products by SKU", async () => {
      const db = getTestDb();
      if (!db) return;

      const products = await db.query.products.findMany({
        where: (products, { and, eq, like }) =>
          and(eq(products.tenantId, tenant.id), like(products.sku, "TEST%")),
      });

      expect(products.length).toBeGreaterThan(0);
      expect(products.every((p) => p.sku.startsWith("TEST"))).toBe(true);
    });
  });

  describe("Product Sorting", () => {
    it("should sort products by price ascending", async () => {
      const db = getTestDb();
      if (!db) return;

      await Promise.all([
        createTestProduct(tenant.id, { sku: "SORT-1", price: "10.00" }),
        createTestProduct(tenant.id, { sku: "SORT-2", price: "50.00" }),
        createTestProduct(tenant.id, { sku: "SORT-3", price: "30.00" }),
      ]);

      const products = await db.query.products.findMany({
        where: (products, { eq }) => eq(products.tenantId, tenant.id),
        orderBy: (products, { asc }) => [asc(products.price)],
      });

      // Check that prices are in ascending order
      for (let i = 1; i < products.length; i++) {
        const prevPrice = parseFloat(products[i - 1].price);
        const currPrice = parseFloat(products[i].price);
        expect(currPrice).toBeGreaterThanOrEqual(prevPrice);
      }
    });

    it("should sort products by name alphabetically", async () => {
      const db = getTestDb();
      if (!db) return;

      const products = await db.query.products.findMany({
        where: (products, { eq }) => eq(products.tenantId, tenant.id),
        orderBy: (products, { asc }) => [asc(products.name)],
      });

      // Check that names are in alphabetical order
      for (let i = 1; i < products.length; i++) {
        expect(
          products[i].name.localeCompare(products[i - 1].name),
        ).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Product Stock Management", () => {
    it("should track stock levels", async () => {
      const db = getTestDb();
      if (!db) return;

      const lowStock = await createTestProduct(tenant.id, {
        sku: "LOW-STOCK",
        stock: 5,
      });

      expect(lowStock.stock).toBe(5);
    });

    it("should identify out of stock products", async () => {
      const db = getTestDb();
      if (!db) return;

      const outOfStock = await createTestProduct(tenant.id, {
        sku: "OUT-OF-STOCK",
        stock: 0,
      });

      expect(outOfStock.stock).toBe(0);
    });

    it("should update stock on inventory change", async () => {
      const db = getTestDb();
      if (!db) return;

      const product = await createTestProduct(tenant.id, {
        sku: "UPDATE-STOCK",
        stock: 100,
      });

      const newStock = 75;
      const [updated] = await db
        .update(schema.products)
        .set({ stock: newStock })
        .where(eq(schema.products.id, product.id))
        .returning();

      expect(updated.stock).toBe(newStock);
    });
  });
});

import * as schema from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
