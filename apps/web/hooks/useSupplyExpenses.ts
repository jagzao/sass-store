"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getExpenseLinks,
  getExpenseLink,
  createExpenseLink,
  cancelExpenseLink,
  deleteExpenseLink,
  getSupplyExpenseReport,
  type InventoryExpenseLink,
  type SupplyExpenseReport,
  type CreateExpenseLinkData,
} from "@/lib/api/supply-expenses";
import { toast } from "sonner";

const EXPENSE_LINKS_KEY = "expense-links";
const EXPENSE_LINK_KEY = "expense-link";
const SUPPLY_REPORT_KEY = "supply-report";

export function useExpenseLinks(tenantId: string, productId?: string) {
  return useQuery({
    queryKey: [EXPENSE_LINKS_KEY, tenantId, productId],
    queryFn: () => getExpenseLinks(tenantId, productId),
    enabled: !!tenantId,
  });
}

export function useExpenseLink(linkId: string) {
  return useQuery({
    queryKey: [EXPENSE_LINK_KEY, linkId],
    queryFn: () => getExpenseLink(linkId),
    enabled: !!linkId,
  });
}

export function useCreateExpenseLink(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExpenseLinkData) =>
      createExpenseLink(tenantId, data),
    onSuccess: (newLink) => {
      queryClient.invalidateQueries({
        queryKey: [EXPENSE_LINKS_KEY, tenantId],
      });
      toast.success("Vinculación de gasto creada exitosamente");
      return newLink;
    },
    onError: (error: Error) => {
      toast.error(`Error al crear vinculación: ${error.message}`);
    },
  });
}

export function useCancelExpenseLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ linkId, reason }: { linkId: string; reason?: string }) =>
      cancelExpenseLink(linkId, reason),
    onSuccess: (updatedLink, variables) => {
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({
        queryKey: [EXPENSE_LINKS_KEY],
      });
      queryClient.invalidateQueries({
        queryKey: [EXPENSE_LINK_KEY, variables.linkId],
      });
      queryClient.invalidateQueries({
        queryKey: [SUPPLY_REPORT_KEY],
      });
      toast.success("Vinculación cancelada");
    },
    onError: (error: Error) => {
      toast.error(`Error al cancelar vinculación: ${error.message}`);
    },
  });
}

export function useDeleteExpenseLink(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (linkId: string) => deleteExpenseLink(linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [EXPENSE_LINKS_KEY, tenantId],
      });
      queryClient.invalidateQueries({
        queryKey: [SUPPLY_REPORT_KEY],
      });
      toast.success("Vinculación eliminada");
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar vinculación: ${error.message}`);
    },
  });
}

export function useSupplyExpenseReport(
  tenantId: string,
  startDate?: string,
  endDate?: string,
) {
  return useQuery({
    queryKey: [SUPPLY_REPORT_KEY, tenantId, startDate, endDate],
    queryFn: () => getSupplyExpenseReport(tenantId, startDate, endDate),
    enabled: !!tenantId,
  });
}

// Hook para obtener el total de gastos en insumos del mes actual
export function useCurrentMonthSupplyExpenses(tenantId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const { data, ...rest } = useSupplyExpenseReport(
    tenantId,
    startOfMonth,
    endOfMonth,
  );

  return {
    report: data,
    totalCost: data?.totals?.totalCost || "0",
    productCount: data?.totals?.productCount || 0,
    ...rest,
  };
}

// Hook para gastos de un producto específico
export function useProductSupplyExpenses(productId: string, tenantId: string) {
  const { data: links, ...rest } = useExpenseLinks(tenantId, productId);

  const totalCost =
    links?.reduce((sum, link) => sum + parseFloat(link.totalCost), 0) || 0;

  const totalQuantity =
    links?.reduce((sum, link) => sum + parseFloat(link.quantity), 0) || 0;

  return {
    links: links || [],
    totalCost: totalCost.toFixed(2),
    totalQuantity: totalQuantity.toFixed(2),
    transactionCount: links?.length || 0,
    ...rest,
  };
}
