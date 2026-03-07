// Cliente API para presupuestos
import { getApiUrl } from "./client-config";

export type BudgetPeriodType = "weekly" | "biweekly" | "monthly" | "custom";
export type BudgetStatus = "active" | "paused" | "completed" | "cancelled";

export interface Budget {
  id: string;
  tenantId: string;
  name: string;
  periodType: BudgetPeriodType;
  startDate: string;
  endDate: string;
  totalLimit: string;
  currency: string;
  status: BudgetStatus;
  rolloverEnabled: boolean;
  alertThreshold: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategory {
  id: string;
  budgetId: string;
  categoryId: string;
  limitAmount: string;
  alertThreshold: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetProgress {
  budgetId: string;
  tenantId: string;
  budgetName: string;
  periodType: BudgetPeriodType;
  startDate: string;
  endDate: string;
  totalLimit: string;
  status: BudgetStatus;
  alertThreshold: number;
  rolloverEnabled: boolean;
  spentAmount: string;
  remaining: string;
  percentageUsed: number;
  alertTriggered: boolean;
  transactionCount: number;
}

export interface CreateBudgetData {
  name: string;
  periodType: BudgetPeriodType;
  startDate: string;
  endDate: string;
  totalLimit: string;
  currency?: string;
  rolloverEnabled?: boolean;
  alertThreshold?: number;
  notes?: string;
  categories?: CreateBudgetCategoryData[];
}

export interface CreateBudgetCategoryData {
  categoryId: string;
  limitAmount: string;
  alertThreshold?: number;
  notes?: string;
}

export interface UpdateBudgetData {
  name?: string;
  totalLimit?: string;
  status?: BudgetStatus;
  rolloverEnabled?: boolean;
  alertThreshold?: number;
  notes?: string;
}

export async function getBudgets(
  tenantId: string,
  status?: BudgetStatus,
): Promise<Budget[]> {
  const url = new URL(`${getApiUrl()}/api/finance/budgets`);
  url.searchParams.append("tenant", tenantId);
  if (status) url.searchParams.append("status", status);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Error fetching budgets");
  }

  return data.data;
}

export async function getBudget(
  budgetId: string,
  tenantId: string,
  includeProgress = false,
): Promise<{ budget: Budget; progress?: BudgetProgress }> {
  const url = new URL(`${getApiUrl()}/api/finance/budgets/${budgetId}`);
  url.searchParams.append("tenant", tenantId);
  if (includeProgress) url.searchParams.append("includeProgress", "true");

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Error fetching budget");
  }

  return data.data;
}

export async function createBudget(
  tenantId: string,
  budgetData: CreateBudgetData,
): Promise<Budget> {
  const response = await fetch(`${getApiUrl()}/api/finance/budgets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...budgetData,
      tenantSlug: tenantId,
      totalLimit: Number(budgetData.totalLimit),
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Error creating budget");
  }

  return data.data;
}

export async function updateBudget(
  budgetId: string,
  tenantId: string,
  budgetData: UpdateBudgetData,
): Promise<Budget> {
  const response = await fetch(
    `${getApiUrl()}/api/finance/budgets/${budgetId}?tenant=${tenantId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(budgetData),
    },
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Error updating budget");
  }

  return data.data;
}

export async function deleteBudget(
  budgetId: string,
  tenantId: string,
): Promise<void> {
  const response = await fetch(
    `${getApiUrl()}/api/finance/budgets/${budgetId}?tenant=${tenantId}`,
    {
      method: "DELETE",
    },
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Error deleting budget");
  }
}

export async function getBudgetCategories(
  budgetId: string,
  tenantId: string,
): Promise<BudgetCategory[]> {
  const response = await fetch(
    `${getApiUrl()}/api/finance/budgets/${budgetId}/categories?tenant=${tenantId}`,
  );
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Error fetching budget categories");
  }

  return data.data;
}

export async function addBudgetCategory(
  budgetId: string,
  tenantId: string,
  categoryData: CreateBudgetCategoryData,
): Promise<BudgetCategory> {
  const response = await fetch(
    `${getApiUrl()}/api/finance/budgets/${budgetId}/categories?tenant=${tenantId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryData),
    },
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Error adding budget category");
  }

  return data.data;
}
