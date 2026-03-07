import {
  Result,
  Ok,
  Err,
  isSuccess,
  isFailure,
} from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
import { z } from "zod";

// Types
export interface InventoryExpenseLink {
  id: string;
  tenantId: string;
  productId: string;
  inventoryTransactionId: string;
  financialMovementId?: string;
  quantity: string;
  unitCost: string;
  totalCost: string;
  status: "active" | "cancelled" | "adjusted";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryExpenseLinkWithDetails extends InventoryExpenseLink {
  productName: string;
  productSku: string;
  expenseCategory?: string;
  categoryColor?: string;
  expenseDate?: Date;
  expenseDescription?: string;
}

export interface SupplyExpenseSummary {
  productId: string;
  productName: string;
  categoryName?: string;
  totalQuantity: string;
  totalCost: string;
  transactionCount: number;
}

export interface UpdateSupplyProductData {
  isSupply?: boolean;
  expenseCategoryId?: string | null;
  autoCreateExpense?: boolean;
  expenseDescriptionTemplate?: string;
}

export interface CreateManualExpenseLinkData {
  tenantId: string;
  productId: string;
  inventoryTransactionId: string;
  quantity: string;
  unitCost: string;
  expenseCategoryId?: string;
  notes?: string;
}

// Zod Schemas
const UpdateSupplyProductSchema = z.object({
  isSupply: z.boolean().optional(),
  expenseCategoryId: z.string().uuid().nullable().optional(),
  autoCreateExpense: z.boolean().optional(),
  expenseDescriptionTemplate: z.string().optional(),
});

const CreateManualExpenseLinkSchema = z.object({
  tenantId: z.string().uuid(),
  productId: z.string().uuid(),
  inventoryTransactionId: z.string().uuid(),
  quantity: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid quantity format"),
  unitCost: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid cost format"),
  expenseCategoryId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

// Mock Database for Inventory Expense Links
class InventoryExpenseLinkDatabase {
  private links: Map<string, InventoryExpenseLink> = new Map();

  async createLink(link: InventoryExpenseLink): Promise<InventoryExpenseLink> {
    this.links.set(link.id, link);
    return link;
  }

  async getLink(id: string): Promise<InventoryExpenseLink | null> {
    return this.links.get(id) || null;
  }

  async getLinkByTransactionId(
    transactionId: string,
  ): Promise<InventoryExpenseLink | null> {
    for (const link of this.links.values()) {
      if (link.inventoryTransactionId === transactionId) {
        return link;
      }
    }
    return null;
  }

  async getLinksByTenant(tenantId: string): Promise<InventoryExpenseLink[]> {
    const links: InventoryExpenseLink[] = [];
    for (const link of this.links.values()) {
      if (link.tenantId === tenantId) {
        links.push(link);
      }
    }
    return links.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getLinksByProduct(productId: string): Promise<InventoryExpenseLink[]> {
    const links: InventoryExpenseLink[] = [];
    for (const link of this.links.values()) {
      if (link.productId === productId) {
        links.push(link);
      }
    }
    return links.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateLink(
    id: string,
    updates: Partial<InventoryExpenseLink>,
  ): Promise<InventoryExpenseLink> {
    const existing = this.links.get(id);
    if (!existing) {
      throw new Error(`Inventory expense link with ID ${id} not found`);
    }
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.links.set(id, updated);
    return updated;
  }

  async deleteLink(id: string): Promise<boolean> {
    return this.links.delete(id);
  }

  // Clear all data (for testing)
  clear(): void {
    this.links.clear();
  }
}

// Service Class
export class InventoryExpenseLinkService {
  private db: InventoryExpenseLinkDatabase;

  constructor() {
    this.db = new InventoryExpenseLinkDatabase();
  }

  // Mark product as supply
  async markProductAsSupply(
    productId: string,
    data: UpdateSupplyProductData,
  ): Promise<Result<{ productId: string; isSupply: boolean }, DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(productId);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_product_id",
          "Invalid product ID format",
          "productId",
          productId,
        ),
      );
    }

    const validation = validateWithZod(UpdateSupplyProductSchema, data);
    if (isFailure(validation)) {
      return validation;
    }

    try {
      // In real implementation, this would update the products table
      // For now, we return success
      return Ok({
        productId,
        isSupply: data.isSupply ?? true,
      });
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "mark_product_as_supply",
          `Failed to mark product ${productId} as supply`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Create manual expense link
  async createManualExpenseLink(
    data: CreateManualExpenseLinkData,
  ): Promise<Result<InventoryExpenseLink, DomainError>> {
    const validation = validateWithZod(CreateManualExpenseLinkSchema, data);
    if (isFailure(validation)) {
      return validation;
    }

    try {
      // Check if link already exists for this transaction
      const existing = await this.db.getLinkByTransactionId(
        data.inventoryTransactionId,
      );
      if (existing) {
        return Err(
          ErrorFactories.businessRule(
            "link_already_exists",
            `An expense link already exists for transaction ${data.inventoryTransactionId}`,
            "DUPLICATE_EXPENSE_LINK",
          ),
        );
      }

      const totalCost = (
        parseFloat(data.quantity) * parseFloat(data.unitCost)
      ).toFixed(2);

      const now = new Date();
      const link: InventoryExpenseLink = {
        id: crypto.randomUUID(),
        tenantId: data.tenantId,
        productId: data.productId,
        inventoryTransactionId: data.inventoryTransactionId,
        quantity: data.quantity,
        unitCost: data.unitCost,
        totalCost,
        status: "active",
        notes: data.notes,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.db.createLink(link);
      return Ok(created);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "create_expense_link",
          "Failed to create inventory expense link",
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Get expense link by ID
  async getExpenseLink(
    id: string,
  ): Promise<Result<InventoryExpenseLink, DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(id);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_link_id",
          "Invalid expense link ID format",
          "id",
          id,
        ),
      );
    }

    try {
      const link = await this.db.getLink(id);
      if (!link) {
        return Err(
          ErrorFactories.notFound(
            "InventoryExpenseLink",
            id,
            `Expense link with ID ${id} not found`,
          ),
        );
      }
      return Ok(link);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "get_expense_link",
          `Failed to get expense link ${id}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Get all expense links for a tenant
  async getExpenseLinksByTenant(
    tenantId: string,
  ): Promise<Result<InventoryExpenseLink[], DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(tenantId);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_tenant_id",
          "Invalid tenant ID format",
          "tenantId",
          tenantId,
        ),
      );
    }

    try {
      const links = await this.db.getLinksByTenant(tenantId);
      return Ok(links);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "get_tenant_expense_links",
          `Failed to get expense links for tenant ${tenantId}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Get expense links by product
  async getExpenseLinksByProduct(
    productId: string,
  ): Promise<Result<InventoryExpenseLink[], DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(productId);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_product_id",
          "Invalid product ID format",
          "productId",
          productId,
        ),
      );
    }

    try {
      const links = await this.db.getLinksByProduct(productId);
      return Ok(links);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "get_product_expense_links",
          `Failed to get expense links for product ${productId}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Cancel expense link
  async cancelExpenseLink(
    id: string,
    reason?: string,
  ): Promise<Result<InventoryExpenseLink, DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(id);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_link_id",
          "Invalid expense link ID format",
          "id",
          id,
        ),
      );
    }

    try {
      const link = await this.db.getLink(id);
      if (!link) {
        return Err(
          ErrorFactories.notFound(
            "InventoryExpenseLink",
            id,
            `Expense link with ID ${id} not found`,
          ),
        );
      }

      if (link.status === "cancelled") {
        return Err(
          ErrorFactories.businessRule(
            "link_already_cancelled",
            `Expense link ${id} is already cancelled`,
            "ALREADY_CANCELLED",
          ),
        );
      }

      const updated = await this.db.updateLink(id, {
        status: "cancelled",
        notes: reason
          ? `${link.notes || ""} | Cancelled: ${reason}`
          : link.notes,
      });

      return Ok(updated);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "cancel_expense_link",
          `Failed to cancel expense link ${id}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Delete expense link
  async deleteExpenseLink(id: string): Promise<Result<void, DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(id);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_link_id",
          "Invalid expense link ID format",
          "id",
          id,
        ),
      );
    }

    try {
      const link = await this.db.getLink(id);
      if (!link) {
        return Err(
          ErrorFactories.notFound(
            "InventoryExpenseLink",
            id,
            `Expense link with ID ${id} not found`,
          ),
        );
      }

      await this.db.deleteLink(id);
      return Ok(undefined);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "delete_expense_link",
          `Failed to delete expense link ${id}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Get supply expenses summary
  async getSupplyExpensesSummary(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Result<SupplyExpenseSummary[], DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(tenantId);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_tenant_id",
          "Invalid tenant ID format",
          "tenantId",
          tenantId,
        ),
      );
    }

    try {
      const links = await this.db.getLinksByTenant(tenantId);

      // Filter by date range if provided
      const filtered = links.filter((link) => {
        if (startDate && link.createdAt < startDate) return false;
        if (endDate && link.createdAt > endDate) return false;
        return link.status === "active";
      });

      // Group by product
      const summaryMap = new Map<string, SupplyExpenseSummary>();

      for (const link of filtered) {
        const existing = summaryMap.get(link.productId);
        if (existing) {
          existing.totalQuantity = (
            parseFloat(existing.totalQuantity) + parseFloat(link.quantity)
          ).toFixed(2);
          existing.totalCost = (
            parseFloat(existing.totalCost) + parseFloat(link.totalCost)
          ).toFixed(2);
          existing.transactionCount++;
        } else {
          summaryMap.set(link.productId, {
            productId: link.productId,
            productName: `Product ${link.productId}`, // In real impl, fetch product name
            totalQuantity: link.quantity,
            totalCost: link.totalCost,
            transactionCount: 1,
          });
        }
      }

      const summary = Array.from(summaryMap.values()).sort(
        (a, b) => parseFloat(b.totalCost) - parseFloat(a.totalCost),
      );

      return Ok(summary);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "get_supply_expenses_summary",
          `Failed to get supply expenses summary for tenant ${tenantId}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Check if product is marked as supply
  async isProductSupply(
    productId: string,
  ): Promise<Result<boolean, DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(productId);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_product_id",
          "Invalid product ID format",
          "productId",
          productId,
        ),
      );
    }

    try {
      // In real implementation, query products table
      // For now, return mock data
      return Ok(false);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "check_product_supply",
          `Failed to check if product ${productId} is supply`,
          undefined,
          error as Error,
        ),
      );
    }
  }
}

// Export singleton instance
export const inventoryExpenseLinkService = new InventoryExpenseLinkService();
