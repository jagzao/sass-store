"use client";

import { AlertTriangle, ArrowRight, Wallet } from "lucide-react";
import { BudgetCardCompact } from "./BudgetCard";
import { cn } from "@/lib/utils";
import type { Budget, BudgetProgress } from "@/lib/api/budgets";

interface ActiveBudgetsWidgetProps {
  budgets: Array<{ budget: Budget; progress?: BudgetProgress }>;
  onViewAll?: () => void;
  onBudgetClick?: (budgetId: string) => void;
  className?: string;
}

export function ActiveBudgetsWidget({
  budgets,
  onViewAll,
  onBudgetClick,
  className,
}: ActiveBudgetsWidgetProps) {
  // Get budgets with alerts (>80% used)
  const budgetsWithAlerts = budgets.filter(
    (b) => b.progress && b.progress.percentageUsed >= 80,
  );

  // Get top 3 active budgets
  const topBudgets = budgets
    .filter((b) => b.budget.status === "active")
    .slice(0, 3);

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-200 p-6",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Presupuestos Activos
          </h3>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            Ver todos
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Alerts */}
      {budgetsWithAlerts.length > 0 && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {budgetsWithAlerts.length} presupuesto
              {budgetsWithAlerts.length > 1 ? "s" : ""} cerca del límite
            </span>
          </div>
        </div>
      )}

      {/* Budgets List */}
      {topBudgets.length > 0 ? (
        <div className="space-y-3">
          {topBudgets.map(({ budget, progress }) => (
            <div
              key={budget.id}
              onClick={() => onBudgetClick?.(budget.id)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {budget.name}
                </span>
                <span className="text-sm text-gray-500">
                  {progress
                    ? `${formatCurrency(progress.spentAmount)} / ${formatCurrency(
                        budget.totalLimit,
                      )}`
                    : formatCurrency(budget.totalLimit)}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all rounded-full",
                    progress && progress.percentageUsed >= 100
                      ? "bg-red-500"
                      : progress && progress.percentageUsed >= 80
                        ? "bg-orange-500"
                        : "bg-green-500",
                  )}
                  style={{
                    width: `${Math.min(progress?.percentageUsed || 0, 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  {progress
                    ? `${progress.percentageUsed.toFixed(0)}% usado`
                    : "Sin datos"}
                </span>
                {progress && progress.alertTriggered && (
                  <span className="text-xs font-medium text-orange-600">
                    ¡Alerta!
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Wallet className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hay presupuestos activos</p>
          <p className="text-xs text-gray-400 mt-1">
            Crea un presupuesto para comenzar
          </p>
        </div>
      )}
    </div>
  );
}
