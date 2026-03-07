"use client";

import { useState } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import { CategoryList } from "./CategoryList";
import { CategoryForm } from "./CategoryForm";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useSeedDefaultCategories,
} from "@/hooks/useCategories";
import type {
  Category,
  CreateCategoryData,
  UpdateCategoryData,
} from "@/lib/api/categories";

interface CategoryManagerProps {
  tenantId: string;
}

export function CategoryManager({ tenantId }: CategoryManagerProps) {
  const [activeTab, setActiveTab] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: categories, isLoading } = useCategories(tenantId);
  const createCategory = useCreateCategory(tenantId);
  const updateCategory = useUpdateCategory(tenantId);
  const deleteCategory = useDeleteCategory(tenantId);
  const seedCategories = useSeedDefaultCategories(tenantId);

  // Filtrar categorías
  const filteredCategories =
    categories?.filter((category) => {
      const matchesTab =
        activeTab === "all" ? true : category.type === activeTab;
      const matchesSearch =
        searchTerm === ""
          ? true
          : category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.description
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    }) || [];

  // Estadísticas
  const stats = {
    total: categories?.length || 0,
    income: categories?.filter((c) => c.type === "income").length || 0,
    expense: categories?.filter((c) => c.type === "expense").length || 0,
    default: categories?.filter((c) => c.isDefault).length || 0,
  };

  const handleCreate = async (data: CreateCategoryData) => {
    await createCategory.mutateAsync(data);
    setShowForm(false);
  };

  const handleUpdate = async (data: UpdateCategoryData) => {
    if (editingCategory) {
      await updateCategory.mutateAsync({
        categoryId: editingCategory.id,
        data,
      });
      setEditingCategory(null);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta categoría?")) {
      setDeletingId(categoryId);
      try {
        await deleteCategory.mutateAsync(categoryId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleSeedDefaults = async () => {
    if (
      confirm(
        "Esto creará las categorías por defecto (ingresos y gastos). ¿Continuar?",
      )
    ) {
      await seedCategories.mutateAsync();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Categorías de Transacciones
          </h1>
          <p className="text-gray-500 mt-1">
            Organiza tus ingresos y gastos en categorías personalizables
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSeedDefaults}
            disabled={seedCategories.isPending}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                seedCategories.isPending ? "animate-spin" : ""
              }`}
            />
            Restaurar por defecto
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Categoría
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Ingresos</p>
          <p className="text-2xl font-bold text-green-600">{stats.income}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Gastos</p>
          <p className="text-2xl font-bold text-red-600">{stats.expense}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Por Defecto</p>
          <p className="text-2xl font-bold text-gray-600">{stats.default}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Tabs */}
          <div className="flex p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setActiveTab("income")}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "income"
                  ? "bg-white text-green-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Ingresos
            </button>
            <button
              onClick={() => setActiveTab("expense")}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "expense"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Gastos
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500">
          Mostrando {filteredCategories.length} de {stats.total} categorías
        </p>
      </div>

      {/* Category List */}
      <CategoryList
        categories={filteredCategories}
        onEdit={(category) => setEditingCategory(category)}
        onDelete={handleDelete}
        isDeleting={deletingId}
      />

      {/* Create Form Modal */}
      {showForm && (
        <CategoryForm
          onSubmit={(data) => handleCreate(data as CreateCategoryData)}
          onCancel={() => setShowForm(false)}
          isLoading={createCategory.isPending}
        />
      )}

      {/* Edit Form Modal */}
      {editingCategory && (
        <CategoryForm
          initialData={editingCategory}
          onSubmit={(data) => handleUpdate(data as UpdateCategoryData)}
          onCancel={() => setEditingCategory(null)}
          isLoading={updateCategory.isPending}
        />
      )}
    </div>
  );
}
