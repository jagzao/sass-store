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
import { db, transactionCategories, financialMovements, eq, and, sql } from "@sass-store/database";
import type { InferSelectModel } from "drizzle-orm";

// Types
export type TransactionCategory = InferSelectModel<typeof transactionCategories>;

export interface CreateCategoryData {
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

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  isFixed?: boolean;
  parentId?: string | null;
  budgetAlertThreshold?: number;
  sortOrder?: number;
}

// Zod Schemas
const CreateCategoryDataSchema = z.object({
  tenantId: z.string().uuid(),
  type: z.enum(["income", "expense"]),
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format")
    .optional(),
  icon: z.string().max(50).optional(),
  isFixed: z.boolean().optional(),
  parentId: z.string().uuid().optional(),
  budgetAlertThreshold: z.number().min(0).max(100).optional(),
  sortOrder: z.number().int().optional(),
});

const UpdateCategoryDataSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format")
    .optional(),
  icon: z.string().max(50).optional(),
  isFixed: z.boolean().optional(),
  parentId: z.string().uuid().nullable().optional(),
  budgetAlertThreshold: z.number().min(0).max(100).optional(),
  sortOrder: z.number().int().optional(),
});

// Default categories for new tenants
export const DEFAULT_INCOME_CATEGORIES: Omit<CreateCategoryData, "tenantId">[] =
  [
    {
      type: "income",
      name: "Salario",
      description: "Ingresos por trabajo asalariado",
      color: "#10B981",
      icon: "briefcase",
      isFixed: false,
      sortOrder: 1,
    },
    {
      type: "income",
      name: "Ventas",
      description: "Ingresos por venta de productos o servicios",
      color: "#3B82F6",
      icon: "shopping-cart",
      isFixed: false,
      sortOrder: 2,
    },
    {
      type: "income",
      name: "Freelance",
      description: "Trabajos independientes o proyectos",
      color: "#8B5CF6",
      icon: "laptop",
      isFixed: false,
      sortOrder: 3,
    },
    {
      type: "income",
      name: "Inversiones",
      description: "Dividendos, intereses, plusvalías",
      color: "#F59E0B",
      icon: "trending-up",
      isFixed: false,
      sortOrder: 4,
    },
    {
      type: "income",
      name: "Regalos",
      description: "Dinero recibido como regalo",
      color: "#EC4899",
      icon: "gift",
      isFixed: false,
      sortOrder: 5,
    },
    {
      type: "income",
      name: "Reembolsos",
      description: "Devoluciones de dinero",
      color: "#6B7280",
      icon: "rotate-ccw",
      isFixed: false,
      sortOrder: 6,
    },
    {
      type: "income",
      name: "Otros Ingresos",
      description: "Otros ingresos misceláneos",
      color: "#9CA3AF",
      icon: "plus-circle",
      isFixed: false,
      sortOrder: 99,
    },
  ];

export const DEFAULT_EXPENSE_CATEGORIES: Omit<
  CreateCategoryData,
  "tenantId"
>[] = [
  {
    type: "expense",
    name: "Vivienda",
    description: "Renta, hipoteca, mantenimiento",
    color: "#EF4444",
    icon: "home",
    isFixed: true,
    sortOrder: 1,
  },
  {
    type: "expense",
    name: "Alimentación",
    description: "Comida, supermercado, restaurantes",
    color: "#F97316",
    icon: "utensils",
    isFixed: false,
    sortOrder: 2,
  },
  {
    type: "expense",
    name: "Transporte",
    description: "Gasolina, transporte público, Uber",
    color: "#84CC16",
    icon: "car",
    isFixed: false,
    sortOrder: 3,
  },
  {
    type: "expense",
    name: "Servicios",
    description: "Luz, agua, internet, teléfono",
    color: "#06B6D4",
    icon: "zap",
    isFixed: true,
    sortOrder: 4,
  },
  {
    type: "expense",
    name: "Educación",
    description: "Colegiaturas, cursos, libros",
    color: "#3B82F6",
    icon: "graduation-cap",
    isFixed: true,
    sortOrder: 5,
  },
  {
    type: "expense",
    name: "Salud",
    description: "Médico, medicinas, seguros",
    color: "#EC4899",
    icon: "heart-pulse",
    isFixed: false,
    sortOrder: 6,
  },
  {
    type: "expense",
    name: "Entretenimiento",
    description: "Cine, streaming, hobbies",
    color: "#8B5CF6",
    icon: "film",
    isFixed: false,
    sortOrder: 7,
  },
  {
    type: "expense",
    name: "Ropa",
    description: "Vestimenta y accesorios",
    color: "#D946EF",
    icon: "shirt",
    isFixed: false,
    sortOrder: 8,
  },
  {
    type: "expense",
    name: "Ahorro/Inversión",
    description: "Aportaciones a ahorro o inversiones",
    color: "#10B981",
    icon: "piggy-bank",
    isFixed: false,
    sortOrder: 9,
  },
  {
    type: "expense",
    name: "Deudas",
    description: "Pagos a tarjetas, préstamos",
    color: "#F43F5E",
    icon: "credit-card",
    isFixed: true,
    sortOrder: 10,
  },
  {
    type: "expense",
    name: "Insumos",
    description: "Materiales, papel, comida (negocio)",
    color: "#6366F1",
    icon: "package",
    isFixed: false,
    sortOrder: 11,
  },
  {
    type: "expense",
    name: "Otros Gastos",
    description: "Gastos misceláneos",
    color: "#9CA3AF",
    icon: "more-horizontal",
    isFixed: false,
    sortOrder: 99,
  },
];

// Service Class - DB-backed implementation
export class TransactionCategoryService {
  // Create a new category
  async createCategory(
    data: CreateCategoryData,
  ): Promise<Result<TransactionCategory, DomainError>> {
    // Validate input data
    const validation = validateWithZod(CreateCategoryDataSchema, data);
    if (isFailure(validation)) {
      return validation;
    }

    // Check for duplicate name within the same tenant and type
    const existingCategories = await db
      .select()
      .from(transactionCategories)
      .where(
        and(
          eq(transactionCategories.tenantId, data.tenantId),
          eq(transactionCategories.name, data.name),
          eq(transactionCategories.type, data.type),
        ),
      )
      .limit(1);

    if (existingCategories.length > 0) {
      return Err(
        ErrorFactories.businessRule(
          "duplicate_category",
          `Category "${data.name}" already exists for ${data.type}`,
          "DUPLICATE_CATEGORY",
        ),
      );
    }

    // Validate parent category if provided
    if (data.parentId) {
      const parentValidation = CommonSchemas.uuid.parse(data.parentId);
      if (isFailure(parentValidation)) {
        return Err(
          ErrorFactories.validation(
            "invalid_parent_id",
            "Invalid parent category ID format",
            "parentId",
            data.parentId,
          ),
        );
      }

      const parentCategories = await db
        .select()
        .from(transactionCategories)
        .where(eq(transactionCategories.id, data.parentId))
        .limit(1);

      if (parentCategories.length === 0) {
        return Err(
          ErrorFactories.notFound(
            "TransactionCategory",
            data.parentId,
            `Parent category with ID ${data.parentId} not found`,
          ),
        );
      }

      const parent = parentCategories[0];

      // Ensure parent is of the same type
      if (parent.type !== data.type) {
        return Err(
          ErrorFactories.businessRule(
            "parent_type_mismatch",
            "Parent category must be of the same type (income/expense)",
            "PARENT_TYPE_MISMATCH",
          ),
        );
      }
    }

    const now = new Date();
    const insertData = {
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

    const result = await db
      .insert(transactionCategories)
      .values(insertData)
      .returning();

    if (!result[0]) {
      return Err(
        ErrorFactories.database(
          "create_category",
          `Failed to create category ${data.name}`,
          undefined,
          new Error("No result returned from insert"),
        ),
      );
    }

    return Ok(result[0]);
  }

  // Get category by ID
  async getCategory(
    id: string,
  ): Promise<Result<TransactionCategory, DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(id);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_category_id",
          "Invalid category ID format",
          "id",
          id,
        ),
      );
    }

    const result = await db
      .select()
      .from(transactionCategories)
      .where(eq(transactionCategories.id, id))
      .limit(1);

    if (result.length === 0) {
      return Err(
        ErrorFactories.notFound(
          "TransactionCategory",
          id,
          `Category with ID ${id} not found`,
        ),
      );
    }

    return Ok(result[0]);
  }

  // Get all categories for a tenant
  async getCategoriesByTenant(
    tenantId: string,
  ): Promise<Result<TransactionCategory[], DomainError>> {
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

    const categories = await db
      .select()
      .from(transactionCategories)
      .where(eq(transactionCategories.tenantId, tenantId))
      .orderBy(transactionCategories.sortOrder);

    return Ok(categories);
  }

  // Get categories by tenant and type
  async getCategoriesByType(
    tenantId: string,
    type: "income" | "expense",
  ): Promise<Result<TransactionCategory[], DomainError>> {
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

    const categories = await db
      .select()
      .from(transactionCategories)
      .where(
        and(
          eq(transactionCategories.tenantId, tenantId),
          eq(transactionCategories.type, type),
        ),
      )
      .orderBy(transactionCategories.sortOrder);

    return Ok(categories);
  }

  // Update category
  async updateCategory(
    id: string,
    data: UpdateCategoryData,
  ): Promise<Result<TransactionCategory, DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(id);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_category_id",
          "Invalid category ID format",
          "id",
          id,
        ),
      );
    }

    const validation = validateWithZod(UpdateCategoryDataSchema, data);
    if (isFailure(validation)) {
      return validation;
    }

    const existingCategories = await db
      .select()
      .from(transactionCategories)
      .where(eq(transactionCategories.id, id))
      .limit(1);

    if (existingCategories.length === 0) {
      return Err(
        ErrorFactories.notFound(
          "TransactionCategory",
          id,
          `Category with ID ${id} not found`,
        ),
      );
    }

    const category = existingCategories[0];

    // Check for duplicate name if name is being updated
    if (data.name && data.name !== category.name) {
      const duplicateCheck = await db
        .select()
        .from(transactionCategories)
        .where(
          and(
            eq(transactionCategories.tenantId, category.tenantId),
            eq(transactionCategories.name, data.name),
            eq(transactionCategories.type, category.type),
          ),
        )
        .limit(1);

      if (duplicateCheck.length > 0 && duplicateCheck[0].id !== id) {
        return Err(
          ErrorFactories.businessRule(
            "duplicate_category",
            `Category "${data.name}" already exists for ${category.type}`,
            "DUPLICATE_CATEGORY",
          ),
        );
      }
    }

    // Validate parent category if provided
    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        return Err(
          ErrorFactories.businessRule(
            "self_reference",
            "Category cannot be its own parent",
            "SELF_REFERENCE",
          ),
        );
      }

      if (data.parentId) {
        const parentCategories = await db
          .select()
          .from(transactionCategories)
          .where(eq(transactionCategories.id, data.parentId))
          .limit(1);

        if (parentCategories.length === 0) {
          return Err(
            ErrorFactories.notFound(
              "TransactionCategory",
              data.parentId,
              `Parent category with ID ${data.parentId} not found`,
            ),
          );
        }

        if (parentCategories[0].type !== category.type) {
          return Err(
            ErrorFactories.businessRule(
              "parent_type_mismatch",
              "Parent category must be of the same type (income/expense)",
              "PARENT_TYPE_MISMATCH",
            ),
          );
        }
      }
    }

    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };

    // Handle null parentId
    if (data.parentId === null) {
      updateData.parentId = null;
    }

    const result = await db
      .update(transactionCategories)
      .set(updateData)
      .where(eq(transactionCategories.id, id))
      .returning();

    if (!result[0]) {
      return Err(
        ErrorFactories.database(
          "update_category",
          `Failed to update category ${id}`,
          undefined,
          new Error("No result returned from update"),
        ),
      );
    }

    return Ok(result[0]);
  }

  // Delete category
  async deleteCategory(id: string): Promise<Result<void, DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(id);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_category_id",
          "Invalid category ID format",
          "id",
          id,
        ),
      );
    }

    const existingCategories = await db
      .select()
      .from(transactionCategories)
      .where(eq(transactionCategories.id, id))
      .limit(1);

    if (existingCategories.length === 0) {
      return Err(
        ErrorFactories.notFound(
          "TransactionCategory",
          id,
          `Category with ID ${id} not found`,
        ),
      );
    }

    const category = existingCategories[0];

    // Prevent deletion of default categories
    if (category.isDefault) {
      return Err(
        ErrorFactories.businessRule(
          "cannot_delete_default",
          "Cannot delete default system categories",
          "DELETE_DEFAULT_CATEGORY",
        ),
      );
    }

    // Check if category has financial movements
    const movements = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(financialMovements)
      .where(eq(financialMovements.categoryId, id));

    const hasMovements = movements[0]?.count && movements[0].count > 0;

    if (hasMovements) {
      return Err(
        ErrorFactories.businessRule(
          "category_has_movements",
          "Cannot delete category with associated financial movements",
          "CATEGORY_HAS_MOVEMENTS",
        ),
      );
    }

    await db
      .delete(transactionCategories)
      .where(eq(transactionCategories.id, id));

    return Ok(undefined);
  }

  // Create default categories for a new tenant
  async createDefaultCategories(
    tenantId: string,
  ): Promise<Result<TransactionCategory[], DomainError>> {
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

    const createdCategories: TransactionCategory[] = [];

    // Create income categories
    for (const categoryData of DEFAULT_INCOME_CATEGORIES) {
      const result = await this.createCategory({
        ...categoryData,
        tenantId,
      });
      if (isSuccess(result)) {
        // Mark as default
        const updateResult = await db
          .update(transactionCategories)
          .set({ isDefault: true, updatedAt: new Date() })
          .where(eq(transactionCategories.id, result.data.id))
          .returning();
        if (updateResult[0]) {
          createdCategories.push(updateResult[0]);
        }
      }
    }

    // Create expense categories
    for (const categoryData of DEFAULT_EXPENSE_CATEGORIES) {
      const result = await this.createCategory({
        ...categoryData,
        tenantId,
      });
      if (isSuccess(result)) {
        // Mark as default
        const updateResult = await db
          .update(transactionCategories)
          .set({ isDefault: true, updatedAt: new Date() })
          .where(eq(transactionCategories.id, result.data.id))
          .returning();
        if (updateResult[0]) {
          createdCategories.push(updateResult[0]);
        }
      }
    }

    return Ok(createdCategories);
  }
}

// Export singleton instance
export const transactionCategoryService = new TransactionCategoryService();
