import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryPOSService, CreateSaleInput } from "@/lib/services/POSService";
import { expectSuccess, expectFailure } from "@sass-store/core/src/result";

describe("POSService - Result Pattern Implementation", () => {
  let service: InMemoryPOSService;

  beforeEach(() => {
    service = new InMemoryPOSService();
  });

  describe("createSale", () => {
    const validInput: CreateSaleInput = {
      items: [
        { productId: "prod-1", quantity: 2, unitPrice: 50.0 },
        { productId: "prod-2", quantity: 1, unitPrice: 100.0 },
      ],
      paymentMethod: "cash",
      customerName: "Juan Pérez",
    };

    it("should create a sale with valid data", async () => {
      const result = await service.createSale("tenant-1", validInput);
      const sale = expectSuccess(result);
      expect(sale.items).toHaveLength(2);
      expect(sale.total).toBe(200.0); // 2*50 + 1*100
      expect(sale.paymentMethod).toBe("cash");
      expect(sale.customerName).toBe("Juan Pérez");
      expect(sale.orderNumber).toMatch(/^POS-/);
    });

    it("should create a sale with card payment", async () => {
      const input: CreateSaleInput = { ...validInput, paymentMethod: "card" };
      const result = await service.createSale("tenant-1", input);
      const sale = expectSuccess(result);
      expect(sale.paymentMethod).toBe("card");
    });

    it("should create a sale with mercadopago payment", async () => {
      const input: CreateSaleInput = {
        ...validInput,
        paymentMethod: "mercadopago",
      };
      const result = await service.createSale("tenant-1", input);
      const sale = expectSuccess(result);
      expect(sale.paymentMethod).toBe("mercadopago");
    });

    it("should return validation error for empty items", async () => {
      const result = await service.createSale("tenant-1", {
        ...validInput,
        items: [],
      });
      const error = expectFailure(result);
      expect(error.type).toBe("ValidationError");
      expect(error.message).toContain("at least one item");
    });

    it("should return validation error for negative quantity", async () => {
      const result = await service.createSale("tenant-1", {
        ...validInput,
        items: [{ productId: "prod-1", quantity: -1, unitPrice: 50 }],
      });
      const error = expectFailure(result);
      expect(error.type).toBe("ValidationError");
      expect(error.message).toContain("positive integer");
    });

    it("should return validation error for zero quantity", async () => {
      const result = await service.createSale("tenant-1", {
        ...validInput,
        items: [{ productId: "prod-1", quantity: 0, unitPrice: 50 }],
      });
      const error = expectFailure(result);
      expect(error.type).toBe("ValidationError");
      expect(error.message).toContain("positive integer");
    });

    it("should return validation error for non-integer quantity", async () => {
      const result = await service.createSale("tenant-1", {
        ...validInput,
        items: [{ productId: "prod-1", quantity: 1.5, unitPrice: 50 }],
      });
      const error = expectFailure(result);
      expect(error.type).toBe("ValidationError");
      expect(error.message).toContain("positive integer");
    });

    it("should return validation error when total is zero or negative", async () => {
      const result = await service.createSale("tenant-1", {
        ...validInput,
        items: [{ productId: "prod-1", quantity: 0, unitPrice: 0 }],
      });
      const error = expectFailure(result);
      expect(error.type).toBe("ValidationError");
      expect(error.message).toMatch(/(positive integer)|(greater than 0)/i);
    });

    it("should return validation error for invalid payment method", async () => {
      const result = await service.createSale("tenant-1", {
        ...validInput,
        paymentMethod: "crypto",
      } as any);
      const error = expectFailure(result);
      expect(error.type).toBe("ValidationError");
      expect(error.message).toContain("Invalid payment method");
    });

    it("should return validation error for missing payment method", async () => {
      const result = await service.createSale("tenant-1", {
        ...validInput,
        paymentMethod: "",
      });
      const error = expectFailure(result);
      expect(error.type).toBe("ValidationError");
      expect(error.message).toContain("Invalid payment method");
    });

    it("should create sale without customer name", async () => {
      const result = await service.createSale("tenant-1", {
        ...validInput,
        customerName: undefined,
      });
      const sale = expectSuccess(result);
      expect(sale.customerName).toBeUndefined();
    });

    it("should assign correct tenantId", async () => {
      const result = await service.createSale("tenant-wondernails", validInput);
      const sale = expectSuccess(result);
      expect(sale.tenantId).toBe("tenant-wondernails");
    });

    it("should calculate total correctly for single item", async () => {
      const result = await service.createSale("tenant-1", {
        items: [{ productId: "prod-1", quantity: 3, unitPrice: 25.5 }],
        paymentMethod: "cash",
      });
      const sale = expectSuccess(result);
      expect(sale.total).toBeCloseTo(76.5, 1);
      expect(sale.items[0].totalPrice).toBeCloseTo(76.5, 1);
    });

    it("should generate unique order numbers for each sale", async () => {
      const result1 = await service.createSale("tenant-1", validInput);
      const result2 = await service.createSale("tenant-1", validInput);
      const sale1 = expectSuccess(result1);
      const sale2 = expectSuccess(result2);
      expect(sale1.orderNumber).not.toBe(sale2.orderNumber);
    });

    it("should return validation error for multiple invalid fields", async () => {
      const result = await service.createSale("tenant-1", {
        items: [],
        paymentMethod: "",
      });
      const error = expectFailure(result);
      expect(error.type).toBe("ValidationError");
    });

    describe("Edge cases", () => {
      it("should handle very large quantity", async () => {
        const result = await service.createSale("tenant-1", {
          items: [{ productId: "prod-1", quantity: 99999, unitPrice: 0.01 }],
          paymentMethod: "cash",
        });
        const sale = expectSuccess(result);
        expect(sale.total).toBeCloseTo(999.99, 1);
      });

      it("should handle decimal unit price", async () => {
        const result = await service.createSale("tenant-1", {
          items: [{ productId: "prod-1", quantity: 1, unitPrice: 19.99 }],
          paymentMethod: "cash",
        });
        const sale = expectSuccess(result);
        expect(sale.total).toBeCloseTo(19.99, 2);
      });
    });
  });
});
