// Cliente API para categorías de transacciones
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export interface Category {
  id: string;
  tenantId: string;
  type: "income" | "expense";
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isFixed?: boolean;
  isDefault?: boolean;
  parentId?: string;
  budgetAlertThreshold?: number;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryData {
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

export async function getCategories(
  tenantId: string,
  type?: "income" | "expense",
): Promise<Category[]> {
  const url = new URL(`${API_BASE}/api/categories`);
  url.searchParams.append("tenant", tenantId);
  if (type) url.searchParams.append("type", type);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Error fetching categories");
  }

  return data.data;
}

export async function createCategory(
  tenantId: string,
  categoryData: CreateCategoryData,
): Promise<Category> {
  const response = await fetch(
    `${API_BASE}/api/categories?tenant=${tenantId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryData),
    },
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Error creating category");
  }

  return data.data;
}

export async function updateCategory(
  categoryId: string,
  tenantId: string,
  categoryData: UpdateCategoryData,
): Promise<Category> {
  const response = await fetch(
    `${API_BASE}/api/categories/${categoryId}?tenant=${tenantId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryData),
    },
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Error updating category");
  }

  return data.data;
}

export async function deleteCategory(
  categoryId: string,
  tenantId: string,
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/api/categories/${categoryId}?tenant=${tenantId}`,
    {
      method: "DELETE",
    },
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Error deleting category");
  }
}

export async function seedDefaultCategories(
  tenantId: string,
): Promise<Category[]> {
  const response = await fetch(`${API_BASE}/api/categories/seed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenantId }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Error seeding categories");
  }

  return data.data.categories;
}
