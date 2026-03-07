// Cliente API para gastos de insumos
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

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
  createdAt: string;
  updatedAt: string;
}

export interface SupplyExpenseSummary {
  productId: string;
  productName: string;
  categoryName?: string;
  totalQuantity: string;
  totalCost: string;
  transactionCount: number;
}

export interface SupplyExpenseReport {
  summary: SupplyExpenseSummary[];
  totals: {
    totalCost: string;
    totalQuantity: string;
    totalTransactions: number;
    productCount: number;
  };
  period: {
    startDate: string | null;
    endDate: string | null;
  };
}

export interface CreateExpenseLinkData {
  productId: string;
  inventoryTransactionId: string;
  quantity: string;
  unitCost: string;
  expenseCategoryId?: string;
  notes?: string;
}

export async function getExpenseLinks(
  tenantId: string,
  productId?: string,
): Promise<InventoryExpenseLink[]> {
  const url = new URL(`${API_BASE}/api/inventory/expense-links`);
  url.searchParams.append("tenant", tenantId);
  if (productId) url.searchParams.append("productId", productId);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Error fetching expense links");
  }

  return data.data;
}

export async function getExpenseLink(
  linkId: string,
): Promise<InventoryExpenseLink> {
  const response = await fetch(
    `${API_BASE}/api/inventory/expense-links/${linkId}`,
  );
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Error fetching expense link");
  }

  return data.data;
}

export async function createExpenseLink(
  tenantId: string,
  linkData: CreateExpenseLinkData,
): Promise<InventoryExpenseLink> {
  const response = await fetch(
    `${API_BASE}/api/inventory/expense-links?tenant=${tenantId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(linkData),
    },
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Error creating expense link");
  }

  return data.data;
}

export async function cancelExpenseLink(
  linkId: string,
  reason?: string,
): Promise<InventoryExpenseLink> {
  const response = await fetch(
    `${API_BASE}/api/inventory/expense-links/${linkId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    },
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Error cancelling expense link");
  }

  return data.data;
}

export async function deleteExpenseLink(linkId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE}/api/inventory/expense-links/${linkId}`,
    {
      method: "DELETE",
    },
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Error deleting expense link");
  }
}

export async function getSupplyExpenseReport(
  tenantId: string,
  startDate?: string,
  endDate?: string,
): Promise<SupplyExpenseReport> {
  const url = new URL(`${API_BASE}/api/inventory/supply-report`);
  url.searchParams.append("tenant", tenantId);
  if (startDate) url.searchParams.append("startDate", startDate);
  if (endDate) url.searchParams.append("endDate", endDate);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Error fetching supply report");
  }

  return data.data;
}
