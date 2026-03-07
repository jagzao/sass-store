"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetCategories,
  addBudgetCategory,
  type Budget,
  type BudgetProgress,
  type BudgetCategory,
  type CreateBudgetData,
  type UpdateBudgetData,
  type CreateBudgetCategoryData,
  type BudgetStatus,
} from "@/lib/api/budgets";
import { toast } from "sonner";

const BUDGETS_KEY = "budgets";
const BUDGET_KEY = "budget";
const BUDGET_CATEGORIES_KEY = "budget-categories";

export function useBudgets(tenantId: string, status?: BudgetStatus) {
  return useQuery({
    queryKey: [BUDGETS_KEY, tenantId, status],
    queryFn: () => getBudgets(tenantId, status),
    enabled: !!tenantId,
  });
}

export function useBudget(
  budgetId: string,
  tenantId: string,
  includeProgress = false,
) {
  return useQuery({
    queryKey: [BUDGET_KEY, budgetId, tenantId, includeProgress],
    queryFn: () => getBudget(budgetId, tenantId, includeProgress),
    enabled: !!budgetId && !!tenantId,
  });
}

export function useCreateBudget(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBudgetData) => createBudget(tenantId, data),
    onSuccess: (newBudget) => {
      queryClient.invalidateQueries({ queryKey: [BUDGETS_KEY, tenantId] });
      toast.success(`Presupuesto "${newBudget.name}" creado exitosamente`);
    },
    onError: (error: Error) => {
      toast.error(`Error al crear presupuesto: ${error.message}`);
    },
  });
}

export function useUpdateBudget(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      budgetId,
      data,
    }: {
      budgetId: string;
      data: UpdateBudgetData;
    }) => updateBudget(budgetId, tenantId, data),
    onSuccess: (updatedBudget) => {
      queryClient.invalidateQueries({ queryKey: [BUDGETS_KEY, tenantId] });
      queryClient.invalidateQueries({
        queryKey: [BUDGET_KEY, updatedBudget.id],
      });
      toast.success(`Presupuesto "${updatedBudget.name}" actualizado`);
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar presupuesto: ${error.message}`);
    },
  });
}

export function useDeleteBudget(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (budgetId: string) => deleteBudget(budgetId, tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUDGETS_KEY, tenantId] });
      toast.success("Presupuesto eliminado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar presupuesto: ${error.message}`);
    },
  });
}

export function useBudgetCategories(budgetId: string, tenantId: string) {
  return useQuery({
    queryKey: [BUDGET_CATEGORIES_KEY, budgetId, tenantId],
    queryFn: () => getBudgetCategories(budgetId, tenantId),
    enabled: !!budgetId && !!tenantId,
  });
}

export function useAddBudgetCategory(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      budgetId,
      data,
    }: {
      budgetId: string;
      data: CreateBudgetCategoryData;
    }) => addBudgetCategory(budgetId, tenantId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [BUDGET_CATEGORIES_KEY, variables.budgetId, tenantId],
      });
      queryClient.invalidateQueries({
        queryKey: [BUDGET_KEY, variables.budgetId],
      });
      toast.success("Categoría agregada al presupuesto");
    },
    onError: (error: Error) => {
      toast.error(`Error al agregar categoría: ${error.message}`);
    },
  });
}

// Hook para obtener presupuestos activos
export function useActiveBudgets(tenantId: string) {
  return useBudgets(tenantId, "active");
}

// Hook para obtener el progreso de un presupuesto
export function useBudgetProgress(budgetId: string, tenantId: string) {
  const { data, ...rest } = useBudget(budgetId, tenantId, true);

  return {
    budget: data?.budget,
    progress: data?.progress,
    ...rest,
  };
}

// Hook para calcular el total de límites de categorías vs límite total
export function useBudgetValidation(
  budgetId: string,
  tenantId: string,
  totalLimit: number,
) {
  const { data: categories } = useBudgetCategories(budgetId, tenantId);

  const categoriesTotal =
    categories?.reduce((sum, cat) => sum + parseFloat(cat.limitAmount), 0) || 0;

  return {
    categoriesTotal,
    remaining: totalLimit - categoriesTotal,
    isOverLimit: categoriesTotal > totalLimit,
    percentageUsed: totalLimit > 0 ? (categoriesTotal / totalLimit) * 100 : 0,
  };
}
