/**
 * TransactionCategory Service Tests
 *
 * Comprehensive tests for transaction category management using Result Pattern.
 * Tests all major category operations with proper error handling and tenant scoping.
 */

// Vitest functions are globally available (globals: true in vitest.config.ts)

import { createTestContext } from "../../setup/TestContext";
import {
  expectSuccess,
  expectFailure,
  expectValidationError,
  expectNotFoundError,
} from "../../setup/TestUtilities";

// Type definitions for the service
interface TransactionCategory {
  id: string;
  tenantId: string;
  type: "income" | "expense";
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  isFixed: boolean;
  isDefault: boolean;
  parentId: string | null;
  budgetAlertThreshold: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateCategoryData {
  tenantId: string;
  type: "income" | "expense";
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isFixed?: boolean;
  parentId?: string;
  budgetAlertThreshold?: number;
  sortOrder?: number;
}

interface UpdateCategoryData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  isFixed?: boolean;
  parentId?: string | null;
  budgetAlertThreshold?: number;
  sortOrder?: number;
}

// Mock TransactionCategory Service for testing
class MockTransactionCategoryService {
  constructor(private db: any) {}

  async createCategory(data: CreateCategoryData) {
    // Validate tenant ID (UUID format)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(data.tenantId)) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Invalid tenant ID format",
          field: "tenantId",
          value: data.tenantId,
        },
      };
    }

    // Validate name
    if (!data.name || data.name.length === 0) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Category name is required",
          field: "name",
        },
      };
    }

    if (data.name.length > 50) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Category name must be 50 characters or less",
          field: "name",
        },
      };
    }

    // Validate color format if provided
    if (data.color && !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Invalid hex color format",
          field: "color",
          value: data.color,
        },
      };
    }

    // Validate budget alert threshold
    if (
      data.budgetAlertThreshold !== undefined &&
      (data.budgetAlertThreshold < 0 || data.budgetAlertThreshold > 100)
    ) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Budget alert threshold must be between 0 and 100",
          field: "budgetAlertThreshold",
        },
      };
    }

    // Validate parent ID format if provided
    if (data.parentId && !uuidRegex.test(data.parentId)) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Invalid parent category ID format",
          field: "parentId",
          value: data.parentId,
        },
      };
    }

    // Check for duplicate name within same tenant and type
    const existingCategories = await this.db.categories.findMany(
      (c: TransactionCategory) =>
        c.tenantId === data.tenantId &&
        c.name === data.name &&
        c.type === data.type,
    );

    if (existingCategories.length > 0) {
      return {
        success: false,
        error: {
          type: "BusinessRuleError",
          message: `Category "${data.name}" already exists for ${data.type}`,
          rule: "duplicate_category",
        },
      };
    }

    // Check parent exists if provided
    if (data.parentId) {
      const parentCategories = await this.db.categories.findMany(
        (c: TransactionCategory) => c.id === data.parentId,
      );

      if (parentCategories.length === 0) {
        return {
          success: false,
          error: {
            type: "NotFoundError",
            resource: "TransactionCategory",
            resourceId: data.parentId,
            message: `Parent category with ID ${data.parentId} not found`,
          },
        };
      }
    }

    // Create category
    const now = new Date();
    const category: TransactionCategory = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      type: data.type,
      name: data.name,
      description: data.description ?? null,
      color: data.color || (data.type === "income" ? "#10B981" : "#EF4444"),
      icon: data.icon ?? null,
      isFixed: data.isFixed ?? false,
      isDefault: false,
      parentId: data.parentId ?? null,
      budgetAlertThreshold: data.budgetAlertThreshold ?? 80,
      sortOrder: data.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.categories.insert(category);

    return { success: true, data: category };
  }

  async getCategory(id: string) {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Invalid category ID format",
          field: "id",
          value: id,
        },
      };
    }

    const category = await this.db.categories.findById(id);

    if (!category) {
      return {
        success: false,
        error: {
          type: "NotFoundError",
          resource: "TransactionCategory",
          resourceId: id,
          message: `Category with ID ${id} not found`,
        },
      };
    }

    return { success: true, data: category };
  }

  async getCategoriesByTenant(tenantId: string) {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Invalid tenant ID format",
          field: "tenantId",
          value: tenantId,
        },
      };
    }

    const categories = await this.db.categories.findMany(
      (c: TransactionCategory) => c.tenantId === tenantId,
    );

    // Sort by sortOrder
    categories.sort((a: TransactionCategory, b: TransactionCategory) => a.sortOrder - b.sortOrder);

    return { success: true, data: categories };
  }

  async getCategoriesByType(tenantId: string, type: "income" | "expense") {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Invalid tenant ID format",
          field: "tenantId",
          value: tenantId,
        },
      };
    }

    const categories = await this.db.categories.findMany(
      (c: TransactionCategory) => c.tenantId === tenantId && c.type === type,
    );

    // Sort by sortOrder
    categories.sort((a: TransactionCategory, b: TransactionCategory) => a.sortOrder - b.sortOrder);

    return { success: true, data: categories };
  }

  async updateCategory(id: string, data: UpdateCategoryData) {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Invalid category ID format",
          field: "id",
          value: id,
        },
      };
    }

    // Validate name if provided
    if (data.name !== undefined) {
      if (data.name.length === 0 || data.name.length > 50) {
        return {
          success: false,
          error: {
            type: "ValidationError",
            message: "Category name must be between 1 and 50 characters",
            field: "name",
          },
        };
      }
    }

    // Validate color format if provided
    if (data.color && !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Invalid hex color format",
          field: "color",
          value: data.color,
        },
      };
    }

    const existingCategory = await this.db.categories.findById(id);

    if (!existingCategory) {
      return {
        success: false,
        error: {
          type: "NotFoundError",
          resource: "TransactionCategory",
          resourceId: id,
          message: `Category with ID ${id} not found`,
        },
      };
    }

    // Check for self-reference
    if (data.parentId === id) {
      return {
        success: false,
        error: {
          type: "BusinessRuleError",
          message: "Category cannot be its own parent",
          rule: "self_reference",
        },
      };
    }

    // Check for duplicate name if name is being updated
    if (data.name && data.name !== existingCategory.name) {
      const duplicateCheck = await this.db.categories.findMany(
        (c: TransactionCategory) =>
          c.tenantId === existingCategory.tenantId &&
          c.name === data.name &&
          c.type === existingCategory.type &&
          c.id !== id,
      );

      if (duplicateCheck.length > 0) {
        return {
          success: false,
          error: {
            type: "BusinessRuleError",
            message: `Category "${data.name}" already exists for ${existingCategory.type}`,
            rule: "duplicate_category",
          },
        };
      }
    }

    // Update category
    const updatedCategory = {
      ...existingCategory,
      ...data,
      updatedAt: new Date(),
    };

    await this.db.categories.update(id, updatedCategory);

    return { success: true, data: updatedCategory };
  }

  async deleteCategory(id: string) {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Invalid category ID format",
          field: "id",
          value: id,
        },
      };
    }

    const existingCategory = await this.db.categories.findById(id);

    if (!existingCategory) {
      return {
        success: false,
        error: {
          type: "NotFoundError",
          resource: "TransactionCategory",
          resourceId: id,
          message: `Category with ID ${id} not found`,
        },
      };
    }

    // Prevent deletion of default categories
    if (existingCategory.isDefault) {
      return {
        success: false,
        error: {
          type: "BusinessRuleError",
          message: "Cannot delete default system categories",
          rule: "cannot_delete_default",
        },
      };
    }

    await this.db.categories.delete(id);

    return { success: true, data: undefined };
  }

  async createDefaultCategories(tenantId: string) {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Invalid tenant ID format",
          field: "tenantId",
          value: tenantId,
        },
      };
    }

    const defaultCategories: CreateCategoryData[] = [
      { tenantId, type: "income", name: "Salario", color: "#10B981", sortOrder: 1 },
      { tenantId, type: "income", name: "Ventas", color: "#3B82F6", sortOrder: 2 },
      { tenantId, type: "expense", name: "Vivienda", color: "#EF4444", sortOrder: 1 },
      { tenantId, type: "expense", name: "Alimentación", color: "#F97316", sortOrder: 2 },
    ];

    const createdCategories: TransactionCategory[] = [];

    for (const categoryData of defaultCategories) {
      const result = await this.createCategory(categoryData);
      if (result.success) {
        // Mark as default
        const updatedCategory = {
          ...result.data,
          isDefault: true,
          updatedAt: new Date(),
        };
        await this.db.categories.update(result.data.id, updatedCategory);
        createdCategories.push(updatedCategory);
      }
    }

    return { success: true, data: createdCategories };
  }
}

// Helper to create test category
function createTestCategory(
  tenantId: string,
  type: "income" | "expense" = "income",
  overrides: Partial<TransactionCategory> = {},
): TransactionCategory {
  return {
    id: crypto.randomUUID(),
    tenantId,
    type,
    name: `Test Category ${Date.now()}`,
    description: "Test description",
    color: type === "income" ? "#10B981" : "#EF4444",
    icon: "test-icon",
    isFixed: false,
    isDefault: false,
    parentId: null,
    budgetAlertThreshold: 80,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("TransactionCategoryService - Result Pattern Implementation", () => {
  let context: any;
  let categoryService: MockTransactionCategoryService;

  beforeEach(() => {
    context = createTestContext();
    categoryService = new MockTransactionCategoryService(context.db);
  });

  afterEach(() => {
    context?.db?.clear?.();
  });

  describe("createCategory", () => {
    it("should create an income category with valid data", async () => {
      const categoryData: CreateCategoryData = {
        tenantId: context.tenant.id,
        type: "income",
        name: "Test Income Category",
        description: "Test description",
        color: "#10B981",
        icon: "briefcase",
        isFixed: false,
        sortOrder: 1,
      };

      const result = await categoryService.createCategory(categoryData);

      expectSuccess(result);
      expect(result.data.tenantId).toBe(context.tenant.id);
      expect(result.data.type).toBe("income");
      expect(result.data.name).toBe("Test Income Category");
      expect(result.data.color).toBe("#10B981");
      expect(result.data.id).toBeDefined();
      expect(result.data.createdAt).toBeInstanceOf(Date);
    });

    it("should create an expense category with valid data", async () => {
      const categoryData: CreateCategoryData = {
        tenantId: context.tenant.id,
        type: "expense",
        name: "Test Expense Category",
        color: "#EF4444",
      };

      const result = await categoryService.createCategory(categoryData);

      expectSuccess(result);
      expect(result.data.type).toBe("expense");
      expect(result.data.color).toBe("#EF4444");
    });

    it("should return validation error for invalid tenant ID", async () => {
      const result = await categoryService.createCategory({
        tenantId: "invalid-uuid",
        type: "income",
        name: "Test Category",
      });

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
      expect(result.error.field).toBe("tenantId");
    });

    it("should return validation error for missing name", async () => {
      const result = await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "income",
        name: "",
      });

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
      expect(result.error.field).toBe("name");
    });

    it("should return validation error for name exceeding max length", async () => {
      const result = await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "income",
        name: "A".repeat(51),
      });

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
      expect(result.error.field).toBe("name");
    });

    it("should return validation error for invalid color format", async () => {
      const result = await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "income",
        name: "Test Category",
        color: "invalid-color",
      });

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
      expect(result.error.field).toBe("color");
    });

    it("should return business rule error for duplicate category name within same tenant and type", async () => {
      // Create first category
      await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "income",
        name: "Duplicate Test",
      });

      // Try to create duplicate
      const result = await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "income",
        name: "Duplicate Test",
      });

      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.rule).toBe("duplicate_category");
    });

    it("should allow same category name for different types within same tenant", async () => {
      // Create income category
      const incomeResult = await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "income",
        name: "Multi Type Category",
      });
      expectSuccess(incomeResult);

      // Create expense category with same name
      const expenseResult = await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "expense",
        name: "Multi Type Category",
      });
      expectSuccess(expenseResult);
    });

    it("should return validation error for invalid parent ID", async () => {
      const result = await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "income",
        name: "Test Category",
        parentId: "invalid-uuid",
      });

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
      expect(result.error.field).toBe("parentId");
    });

    it("should return not found error for non-existent parent category", async () => {
      const result = await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "income",
        name: "Test Category",
        parentId: crypto.randomUUID(),
      });

      expectFailure(result);
      expect(result.error.type).toBe("NotFoundError");
      expect(result.error.resource).toBe("TransactionCategory");
    });

    it("should return validation error for budget alert threshold out of range", async () => {
      const result = await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "expense",
        name: "Test Category",
        budgetAlertThreshold: 101,
      });

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
      expect(result.error.field).toBe("budgetAlertThreshold");
    });

    it("should accept budget alert threshold at boundaries", async () => {
      // Test minimum
      const minResult = await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "expense",
        name: "Min Threshold Category",
        budgetAlertThreshold: 0,
      });
      expectSuccess(minResult);
      expect(minResult.data.budgetAlertThreshold).toBe(0);

      // Test maximum
      const maxResult = await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "expense",
        name: "Max Threshold Category",
        budgetAlertThreshold: 100,
      });
      expectSuccess(maxResult);
      expect(maxResult.data.budgetAlertThreshold).toBe(100);
    });
  });

  describe("getCategory", () => {
    it("should return category for valid ID", async () => {
      // Create category first
      const createResult = await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "income",
        name: "Get Test Category",
      });

      const result = await categoryService.getCategory(createResult.data.id);

      expectSuccess(result);
      expect(result.data.id).toBe(createResult.data.id);
      expect(result.data.name).toBe("Get Test Category");
    });

    it("should return not found error for non-existent ID", async () => {
      const result = await categoryService.getCategory(crypto.randomUUID());

      expectNotFoundError(result, "TransactionCategory");
    });

    it("should return validation error for invalid UUID", async () => {
      const result = await categoryService.getCategory("invalid-uuid");

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });
  });

  describe("getCategoriesByTenant", () => {
    beforeEach(async () => {
      // Create categories for test tenant
      await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "income",
        name: "Tenant Income 1",
        sortOrder: 1,
      });
      await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "expense",
        name: "Tenant Expense 1",
        sortOrder: 2,
      });
    });

    it("should return all categories for a tenant", async () => {
      const result = await categoryService.getCategoriesByTenant(context.tenant.id);

      expectSuccess(result);
      expect(result.data.length).toBeGreaterThanOrEqual(2);
      expect(result.data.every((c: TransactionCategory) => c.tenantId === context.tenant.id)).toBe(true);
    });

    it("should return empty array for tenant with no categories", async () => {
      const newTenantId = crypto.randomUUID();
      const result = await categoryService.getCategoriesByTenant(newTenantId);

      expectSuccess(result);
      expect(result.data).toEqual([]);
    });

    it("should return validation error for invalid tenant ID", async () => {
      const result = await categoryService.getCategoriesByTenant("invalid-uuid");

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });
  });

  describe("getCategoriesByType", () => {
    beforeEach(async () => {
      await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "income",
        name: "Type Test Income",
      });
      await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "expense",
        name: "Type Test Expense",
      });
    });

    it("should return only income categories when type is income", async () => {
      const result = await categoryService.getCategoriesByType(context.tenant.id, "income");

      expectSuccess(result);
      expect(result.data.every((c: TransactionCategory) => c.type === "income")).toBe(true);
    });

    it("should return only expense categories when type is expense", async () => {
      const result = await categoryService.getCategoriesByType(context.tenant.id, "expense");

      expectSuccess(result);
      expect(result.data.every((c: TransactionCategory) => c.type === "expense")).toBe(true);
    });

    it("should return validation error for invalid tenant ID", async () => {
      const result = await categoryService.getCategoriesByType("invalid-uuid", "income");

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });
  });

  describe("updateCategory", () => {
    let testCategory: TransactionCategory;

    beforeEach(async () => {
      const createResult = await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "income",
        name: "Update Test Category",
      });
      testCategory = createResult.data;
    });

    it("should update category name", async () => {
      const result = await categoryService.updateCategory(testCategory.id, {
        name: "Updated Category Name",
      });

      expectSuccess(result);
      expect(result.data.name).toBe("Updated Category Name");
      expect(result.data.updatedAt.getTime()).toBeGreaterThanOrEqual(testCategory.updatedAt.getTime());
    });

    it("should update category color", async () => {
      const result = await categoryService.updateCategory(testCategory.id, {
        color: "#FF5500",
      });

      expectSuccess(result);
      expect(result.data.color).toBe("#FF5500");
    });

    it("should update multiple fields", async () => {
      const result = await categoryService.updateCategory(testCategory.id, {
        name: "Multi Update Name",
        description: "Updated description",
        icon: "updated-icon",
        isFixed: true,
      });

      expectSuccess(result);
      expect(result.data.name).toBe("Multi Update Name");
      expect(result.data.description).toBe("Updated description");
      expect(result.data.icon).toBe("updated-icon");
      expect(result.data.isFixed).toBe(true);
    });

    it("should return not found error for non-existent category", async () => {
      const result = await categoryService.updateCategory(crypto.randomUUID(), {
        name: "Updated Name",
      });

      expectNotFoundError(result, "TransactionCategory");
    });

    it("should return validation error for invalid category ID", async () => {
      const result = await categoryService.updateCategory("invalid-uuid", {
        name: "Updated Name",
      });

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });

    it("should return validation error for invalid color format", async () => {
      const result = await categoryService.updateCategory(testCategory.id, {
        color: "invalid-color",
      });

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });

    it("should return business rule error for duplicate name", async () => {
      // Create another category
      const otherResult = await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "income",
        name: "Other Category",
      });

      // Try to update with duplicate name
      const result = await categoryService.updateCategory(testCategory.id, {
        name: otherResult.data.name,
      });

      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.rule).toBe("duplicate_category");
    });

    it("should return business rule error for self-referencing parent", async () => {
      const result = await categoryService.updateCategory(testCategory.id, {
        parentId: testCategory.id,
      });

      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.rule).toBe("self_reference");
    });
  });

  describe("deleteCategory", () => {
    let testCategory: TransactionCategory;

    beforeEach(async () => {
      const createResult = await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "income",
        name: "Delete Test Category",
      });
      testCategory = createResult.data;
    });

    it("should delete existing category", async () => {
      const result = await categoryService.deleteCategory(testCategory.id);

      expectSuccess(result);

      // Verify category is deleted
      const getResult = await categoryService.getCategory(testCategory.id);
      expectFailure(getResult);
      expect(getResult.error.type).toBe("NotFoundError");
    });

    it("should return not found error for non-existent category", async () => {
      const result = await categoryService.deleteCategory(crypto.randomUUID());

      expectNotFoundError(result, "TransactionCategory");
    });

    it("should return validation error for invalid category ID", async () => {
      const result = await categoryService.deleteCategory("invalid-uuid");

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });

    it("should return business rule error for default category", async () => {
      // Create a default category
      const defaultCategory = createTestCategory(context.tenant.id, "income", {
        isDefault: true,
      });
      await context.db.categories.insert(defaultCategory);

      const result = await categoryService.deleteCategory(defaultCategory.id);

      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.rule).toBe("cannot_delete_default");
    });
  });

  describe("createDefaultCategories", () => {
    it("should create default income and expense categories for a tenant", async () => {
      const result = await categoryService.createDefaultCategories(context.tenant.id);

      expectSuccess(result);
      expect(result.data.length).toBeGreaterThan(0);

      // Verify we have both income and expense categories
      const incomeCategories = result.data.filter((c: TransactionCategory) => c.type === "income");
      const expenseCategories = result.data.filter((c: TransactionCategory) => c.type === "expense");
      expect(incomeCategories.length).toBeGreaterThan(0);
      expect(expenseCategories.length).toBeGreaterThan(0);

      // Verify all are marked as default
      expect(result.data.every((c: TransactionCategory) => c.isDefault === true)).toBe(true);
    });

    it("should return validation error for invalid tenant ID", async () => {
      const result = await categoryService.createDefaultCategories("invalid-uuid");

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });
  });

  describe("Tenant Scoping", () => {
    it("should not return categories from other tenants", async () => {
      // Create category in test tenant
      const createResult = await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "income",
        name: "Tenant Scoped Category",
      });

      // Create category in other tenant
      const otherTenantId = crypto.randomUUID();
      const otherCategory = createTestCategory(otherTenantId, "income", {
        name: "Other Tenant Category",
      });
      await context.db.categories.insert(otherCategory);

      // Get categories for test tenant
      const result = await categoryService.getCategoriesByTenant(context.tenant.id);

      expectSuccess(result);
      // Should not include other tenant's category
      expect(result.data.find((c: TransactionCategory) => c.id === otherCategory.id)).toBeUndefined();
      // Should include test tenant's category
      expect(result.data.find((c: TransactionCategory) => c.id === createResult.data.id)).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle category with maximum length name", async () => {
      const maxName = "A".repeat(50);

      const result = await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "income",
        name: maxName,
      });

      expectSuccess(result);
      expect(result.data.name).toBe(maxName);
    });

    it("should handle category update with no changes", async () => {
      const createResult = await categoryService.createCategory({
        tenantId: context.tenant.id,
        type: "income",
        name: "No Change Category",
      });

      // Small delay to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await categoryService.updateCategory(createResult.data.id, {});

      expectSuccess(result);
      expect(result.data.updatedAt.getTime()).toBeGreaterThanOrEqual(
        createResult.data.updatedAt.getTime(),
      );
    });
  });
});
