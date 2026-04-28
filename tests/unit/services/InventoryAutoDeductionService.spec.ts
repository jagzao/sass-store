import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryInventoryAutoDeductionService } from "@/lib/services/InventoryAutoDeductionService";
import { expectSuccess, expectFailure } from "@sass-store/core/src/result";

describe("InventoryAutoDeductionService", () => {
  let service: InMemoryInventoryAutoDeductionService;

  beforeEach(() => {
    service = new InMemoryInventoryAutoDeductionService();
  });

  it("should deduct stock successfully when quantities available", () => {
    service.registerProduct({ productId: "prod-1", name: "Shampoo", sku: "SHP-001", stock: 100 });
    service.registerProduct({ productId: "prod-2", name: "Conditioner", sku: "CON-001", stock: 50 });

    const result = service.deductFromSale(
      [
        { productId: "prod-1", quantity: 3, reason: "POS sale #1" },
        { productId: "prod-2", quantity: 1, reason: "POS sale #1" },
      ],
      "tenant-1",
    );

    const deductions = expectSuccess(result);
    expect(deductions).toHaveLength(2);
    expect(deductions[0].remainingStock).toBe(97);
    expect(deductions[1].remainingStock).toBe(49);
  });

  it("should return error when product not found", () => {
    service.registerProduct({ productId: "prod-1", name: "Shampoo", sku: "SHP-001", stock: 10 });

    const result = service.deductFromSale(
      [{ productId: "prod-99", quantity: 1, reason: "test" }],
      "tenant-1",
    );

    const error = expectFailure(result);
    expect(error.type).toBe("NotFoundError");
  });

  it("should return error when stock insufficient", () => {
    service.registerProduct({ productId: "prod-1", name: "Shampoo", sku: "SHP-001", stock: 2 });

    const result = service.deductFromSale(
      [{ productId: "prod-1", quantity: 5, reason: "test" }],
      "tenant-1",
    );

    const error = expectFailure(result);
    expect(error.type).toBe("ValidationError");
    expect(error.message).toContain("Insufficient stock");
  });

  it("should not deduct anything if one item fails (atomic)", () => {
    service.registerProduct({ productId: "prod-1", name: "Shampoo", sku: "SHP-001", stock: 10 });
    service.registerProduct({ productId: "prod-2", name: "Conditioner", sku: "CON-001", stock: 0 });

    const result = service.deductFromSale(
      [
        { productId: "prod-1", quantity: 2, reason: "test" },
        { productId: "prod-2", quantity: 1, reason: "test" },
      ],
      "tenant-1",
    );

    const error = expectFailure(result);
    expect(error.type).toBe("ValidationError");
    // prod-1 no debería haberse deducido (operación atómica)
    expect(service.getStock("prod-1")).toBe(10);
  });
});
