import { Result, Ok, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

export interface InventoryProduct {
  productId: string;
  name: string;
  sku: string;
  stock: number;
}

export interface DeductionInput {
  productId: string;
  quantity: number;
  reason: string;
}

export interface DeductionResult {
  productId: string;
  deductedQuantity: number;
  remainingStock: number;
}

export class InMemoryInventoryAutoDeductionService {
  private inventory: Map<string, InventoryProduct> = new Map();
  private deductions: DeductionResult[] = [];

  registerProduct(product: InventoryProduct): void {
    this.inventory.set(product.productId, product);
  }

  deductFromSale(
    items: DeductionInput[],
    tenantId: string,
  ): Result<DeductionResult[], DomainError> {
    // Pre-validación: stock suficiente para todos
    for (const item of items) {
      const product = this.inventory.get(item.productId);
      if (!product) {
        return Err(
          ErrorFactories.notFound("Product in inventory", item.productId),
        );
      }
      if (product.stock < item.quantity) {
        return Err(
          ErrorFactories.validation(
            `Insufficient stock for ${product.name}: available ${product.stock}, requested ${item.quantity}`,
            "stock",
          ),
        );
      }
    }

    const results: DeductionResult[] = [];
    for (const item of items) {
      const product = this.inventory.get(item.productId)!;
      product.stock -= item.quantity;
      const result: DeductionResult = {
        productId: item.productId,
        deductedQuantity: item.quantity,
        remainingStock: product.stock,
      };
      results.push(result);
      this.deductions.push(result);
    }

    return Ok(results);
  }

  getStock(productId: string): number | undefined {
    return this.inventory.get(productId)?.stock;
  }

  getDeductions(): DeductionResult[] {
    return [...this.deductions];
  }

  clear(): void {
    this.inventory.clear();
    this.deductions = [];
  }
}
