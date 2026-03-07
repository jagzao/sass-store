"use client";

import { useState } from "react";
import {
  Plus,
  Filter,
  Search,
  TrendingUp,
  Wallet,
  Calendar,
} from "lucide-react";
import { BudgetCard } from "./BudgetCard";
import { BudgetForm } from "./BudgetForm";
import {
  useBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from "@/hooks/useBudgets";
import type {
  Budget,
  BudgetStatus,
  CreateBudgetData,
  UpdateBudgetData,
} from "@/lib/api/budgets";

interface BudgetManagerProps {
  tenantId: string;
}

export function BudgetManager({ tenantId }: BudgetManagerProps) {
  const [statusFilter, setStatusFilter] = useState<BudgetStatus | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: budgets, isLoading } = useBudgets(tenantId, statusFilter);
  const createBudget = useCreateBudget(tenantId);
  const updateBudget = useUpdateBudget(tenantId);
  const deleteBudget = useDeleteBudget(tenantId);

  // Filter budgets
  const filteredBudgets =
    budgets?.filter((budget) => {
      if (!searchTerm) return true;
      return (
        budget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        budget.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }) || [];

  // Stats
  const stats = {
    total: budgets?.length || 0,
    active: budgets?.filter((b) => b.status === "active").length || 0,
    completed: budgets?.filter((b) => b.status === "completed").length || 0,
    totalLimit:
      budgets?.reduce((sum, b) => sum + parseFloat(b.totalLimit), 0) || 0,
  };

  const handleCreate = async (data: CreateBudgetData) => {
    await createBudget.mutateAsync(data);
    setShowForm(false);
  };

  const handleUpdate = async (data: UpdateBudgetData) => {
    if (editingBudget) {
      await updateBudget.mutateAsync({
        budgetId: editingBudget.id,
        data,
      });
      setEditingBudget(null);
    }
  };

  const handleDelete = async (budgetId: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este presupuesto?")) {
      setDeletingId(budgetId);
      try {
        await deleteBudget.mutateAsync(budgetId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleStatusChange = async (budgetId: string, status: BudgetStatus) => {
    await updateBudget.mutateAsync({
      budgetId,
      data: { status },
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
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
          <h1 className="text-2xl font-bold text-gray-900">Presupuestos</h1>
          <p className="text-gray-500 mt-1">
            Gestiona tus presupuestos semanales, quincenales o mensuales
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Presupuesto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Wallet className="w-4 h-4" />
            <span className="text-sm">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Activos</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Completados</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Presupuesto Total</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.totalLimit)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter || ""}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value ? (e.target.value as BudgetStatus) : undefined,
                )
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="paused">Pausado</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar presupuesto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500">
          Mostrando {filteredBudgets.length} de {stats.total} presupuestos
        </p>
      </div>

      {/* Budgets Grid */}
      {filteredBudgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBudgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onClick={() => setEditingBudget(budget)}
              onStatusChange={(status) => handleStatusChange(budget.id, status)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">No hay presupuestos para mostrar</p>
          <p className="text-sm text-gray-400 mt-1">
            Crea tu primer presupuesto para comenzar
          </p>
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && (
        <BudgetForm
          onSubmit={(data) => handleCreate(data as CreateBudgetData)}
          onCancel={() => setShowForm(false)}
          isLoading={createBudget.isPending}
        />
      )}

      {/* Edit Form Modal */}
      {editingBudget && (
        <BudgetForm
          initialData={editingBudget}
          onSubmit={(data) => handleUpdate(data as UpdateBudgetData)}
          onCancel={() => setEditingBudget(null)}
          isLoading={updateBudget.isPending}
        />
      )}
    </div>
  );
}
