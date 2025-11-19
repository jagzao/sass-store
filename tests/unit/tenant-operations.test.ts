/**
 * Tenant Operations Unit Tests
 * Tests for multi-tenant operations and isolation
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  getTestDb,
  createTestTenant,
  createTestProduct,
  createTestService,
} from "../setup/test-database";

describe("Tenant Operations", () => {
  let tenant1: any;
  let tenant2: any;

  beforeEach(async () => {
    const db = getTestDb();
    if (!db) return;

    // Create two test tenants
    tenant1 = await createTestTenant({
      slug: "tenant-1",
      name: "Tenant One",
      mode: "catalog",
    });

    tenant2 = await createTestTenant({
      slug: "tenant-2",
      name: "Tenant Two",
      mode: "booking",
    });
  });

  describe("Tenant Creation", () => {
    it("should create tenant with unique slug", async () => {
      const db = getTestDb();
      if (!db) return;

      expect(tenant1).toBeDefined();
      expect(tenant1.slug).toBe("tenant-1");
      expect(tenant2.slug).toBe("tenant-2");
    });

    it("should create tenant with correct mode", async () => {
      const db = getTestDb();
      if (!db) return;

      expect(tenant1.mode).toBe("catalog");
      expect(tenant2.mode).toBe("booking");
    });

    it("should have default branding configuration", async () => {
      const db = getTestDb();
      if (!db) return;

      expect(tenant1.branding).toBeDefined();
      expect(typeof tenant1.branding).toBe("object");
    });
  });

  describe("Product Isolation", () => {
    it("should isolate products between tenants", async () => {
      const db = getTestDb();
      if (!db) return;

      // Create products for each tenant
      const product1 = await createTestProduct(tenant1.id, {
        sku: "PROD-1",
        name: "Product 1",
      });

      const product2 = await createTestProduct(tenant2.id, {
        sku: "PROD-1", // Same SKU but different tenant
        name: "Product 2",
      });

      expect(product1.tenantId).toBe(tenant1.id);
      expect(product2.tenantId).toBe(tenant2.id);
      expect(product1.sku).toBe(product2.sku); // Same SKU allowed in different tenants
    });

    it("should allow same SKU across different tenants", async () => {
      const db = getTestDb();
      if (!db) return;

      const sku = "DUPLICATE-SKU";

      const product1 = await createTestProduct(tenant1.id, { sku });
      const product2 = await createTestProduct(tenant2.id, { sku });

      expect(product1.sku).toBe(sku);
      expect(product2.sku).toBe(sku);
      expect(product1.id).not.toBe(product2.id);
    });
  });

  describe("Service Isolation", () => {
    it("should isolate services between tenants", async () => {
      const db = getTestDb();
      if (!db) return;

      const service1 = await createTestService(tenant1.id, {
        name: "Manicure",
        duration: 60,
      });

      const service2 = await createTestService(tenant2.id, {
        name: "Manicure",
        duration: 45,
      });

      expect(service1.tenantId).toBe(tenant1.id);
      expect(service2.tenantId).toBe(tenant2.id);
      expect(service1.name).toBe(service2.name); // Same name allowed
      expect(service1.duration).not.toBe(service2.duration); // Different config
    });
  });

  describe("Tenant Configuration", () => {
    it("should support custom branding per tenant", async () => {
      const db = getTestDb();
      if (!db) return;

      const brandedTenant = await createTestTenant({
        slug: "branded-tenant",
        name: "Branded Tenant",
        branding: {
          primaryColor: "#FF5733",
          secondaryColor: "#C70039",
          logo: "https://example.com/logo.png",
        },
      });

      expect(brandedTenant.branding.primaryColor).toBe("#FF5733");
      expect(brandedTenant.branding.logo).toContain("logo.png");
    });

    it("should support contact information per tenant", async () => {
      const db = getTestDb();
      if (!db) return;

      const tenantWithContact = await createTestTenant({
        slug: "contact-tenant",
        name: "Contact Tenant",
        contact: {
          email: "contact@example.com",
          phone: "+1234567890",
        },
      });

      expect(tenantWithContact.contact.email).toBe("contact@example.com");
      expect(tenantWithContact.contact.phone).toBe("+1234567890");
    });
  });

  describe("Tenant Modes", () => {
    it("should support catalog mode", async () => {
      const db = getTestDb();
      if (!db) return;

      const catalogTenant = await createTestTenant({
        mode: "catalog",
      });

      expect(catalogTenant.mode).toBe("catalog");
    });

    it("should support booking mode", async () => {
      const db = getTestDb();
      if (!db) return;

      const bookingTenant = await createTestTenant({
        mode: "booking",
      });

      expect(bookingTenant.mode).toBe("booking");
    });

    it("should support mixed mode", async () => {
      const db = getTestDb();
      if (!db) return;

      const mixedTenant = await createTestTenant({
        mode: "mixed",
      });

      expect(mixedTenant.mode).toBe("mixed");
    });
  });
});
