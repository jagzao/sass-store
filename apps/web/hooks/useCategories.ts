"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  seedDefaultCategories,
  type Category,
  type CreateCategoryData,
  type UpdateCategoryData,
} from "@/lib/api/categories";
import { toast } from "sonner";

const CATEGORIES_KEY = "categories";

export function useCategories(tenantId: string, type?: "income" | "expense") {
  return useQuery({
    queryKey: [CATEGORIES_KEY, tenantId, type],
    queryFn: () => getCategories(tenantId, type),
    enabled: !!tenantId,
  });
}

export function useCreateCategory(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryData) => createCategory(tenantId, data),
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY, tenantId] });
      toast.success(`Categoría "${newCategory.name}" creada exitosamente`);
    },
    onError: (error: Error) => {
      toast.error(`Error al crear categoría: ${error.message}`);
    },
  });
}

export function useUpdateCategory(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: UpdateCategoryData;
    }) => updateCategory(categoryId, tenantId, data),
    onSuccess: (updatedCategory) => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY, tenantId] });
      toast.success(`Categoría "${updatedCategory.name}" actualizada`);
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar categoría: ${error.message}`);
    },
  });
}

export function useDeleteCategory(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => deleteCategory(categoryId, tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY, tenantId] });
      toast.success("Categoría eliminada exitosamente");
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar categoría: ${error.message}`);
    },
  });
}

export function useSeedDefaultCategories(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => seedDefaultCategories(tenantId),
    onSuccess: (categories) => {
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY, tenantId] });
      toast.success(`${categories.length} categorías creadas por defecto`);
    },
    onError: (error: Error) => {
      toast.error(`Error al crear categorías por defecto: ${error.message}`);
    },
  });
}

// Hook para filtrar categorías por tipo
export function useCategoriesByType(
  tenantId: string,
  type: "income" | "expense",
) {
  const { data: categories, ...rest } = useCategories(tenantId, type);

  return {
    categories: categories?.filter((c) => c.type === type) || [],
    ...rest,
  };
}

// Hook para obtener categorías de gastos (excluyendo las default si se indica)
export function useExpenseCategories(tenantId: string, includeDefault = true) {
  const { data: categories, ...rest } = useCategories(tenantId, "expense");

  const filteredCategories = includeDefault
    ? categories
    : categories?.filter((c) => !c.isDefault);

  return {
    categories: filteredCategories || [],
    ...rest,
  };
}

// Hook para obtener categorías de ingresos
export function useIncomeCategories(tenantId: string) {
  return useCategoriesByType(tenantId, "income");
}
