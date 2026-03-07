"use client";

import { useState } from "react";
import {
  Calendar,
  TrendingDown,
  TrendingUp,
  MoreVertical,
  Pause,
  Play,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { ProgressBarWithInfo } from "@/components/ui/progress-bar";
import {
  BudgetAlertBadge,
  BudgetStatusBadge,
} from "@/components/ui/alert-badge";
import { cn } from "@/lib/utils";
import type { Budget, BudgetProgress } from "@/lib/api/budgets";

interface BudgetCardProps {
  budget: Budget;
  progress?: BudgetProgress;
  onClick?: () => void;
  onStatusChange?: (status: Budget["status"]) => void;
  className?: string;
}

export function BudgetCard({
  budget,
  progress,
  onClick,
  onStatusChange,
  className,
}: BudgetCardProps) {
  const [showActions, setShowActions] = useState(false);

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: budget.currency || "MXN",
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getPeriodLabel = (period: Budget["periodType"]) => {
    const labels = {
      weekly: "Semanal",
      biweekly: "Quincenal",
      monthly: "Mensual",
      custom: "Personalizado",
    };
    return labels[period];
  };

  const spentAmount = progress ? parseFloat(progress.spentAmount) : 0;
  const totalLimit = parseFloat(budget.totalLimit);
  const percentageUsed = progress ? progress.percentageUsed : 0;
  const remaining = totalLimit - spentAmount;

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl border border-gray-200 p-5 transition-all hover:shadow-lg cursor-pointer relative",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {budget.name}
            </h3>
            <BudgetStatusBadge status={budget.status} />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{getPeriodLabel(budget.periodType)}</span>
            <span className="text-gray-300">•</span>
            <span>
              {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
            </span>
          </div>
        </div>

        {/* Actions Menu */}
        {onStatusChange && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showActions && (
              <div
                className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {budget.status === "active" && (
                  <button
                    onClick={() => {
                      onStatusChange("paused");
                      setShowActions(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Pause className="w-4 h-4" />
                    Pausar
                  </button>
                )}
                {budget.status === "paused" && (
                  <button
                    onClick={() => {
                      onStatusChange("active");
                      setShowActions(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Play className="w-4 h-4" />
                    Reactivar
                  </button>
                )}
                {budget.status !== "completed" && (
                  <button
                    onClick={() => {
                      onStatusChange("completed");
                      setShowActions(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Marcar completado
                  </button>
                )}
                {budget.status !== "cancelled" && (
                  <button
                    onClick={() => {
                      onStatusChange("cancelled");
                      setShowActions(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancelar
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress */}
      {progress ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  Gastado
                </span>
                {progress.alertTriggered && (
                  <BudgetAlertBadge percentage={percentageUsed} />
                )}
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(progress.spentAmount)}
                </span>
                <span className="text-sm text-gray-500 mx-1">/</span>
                <span className="text-sm text-gray-500">
                  {formatCurrency(budget.totalLimit)}
                </span>
                <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {percentageUsed.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500 rounded-full",
                  percentageUsed >= 100
                    ? "bg-red-600"
                    : percentageUsed >= 80
                      ? "bg-orange-500"
                      : "bg-green-500",
                )}
                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Gastado</p>
              <p
                className={cn(
                  "font-semibold",
                  percentageUsed >= 100 ? "text-red-600" : "text-gray-900",
                )}
              >
                {formatCurrency(progress.spentAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Restante</p>
              <p
                className={cn(
                  "font-semibold",
                  remaining < 0 ? "text-red-600" : "text-green-600",
                )}
              >
                {formatCurrency(remaining.toFixed(2))}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Transacciones</p>
              <p className="font-semibold text-gray-900">
                {progress.transactionCount}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-4 text-center">
          <p className="text-sm text-gray-500">
            Presupuesto: {formatCurrency(budget.totalLimit)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Sin datos de progreso</p>
        </div>
      )}

      {/* Rollover indicator */}
      {budget.rolloverEnabled && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-600">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Rollover habilitado</span>
        </div>
      )}
    </div>
  );
}

// Compact version for lists
interface BudgetCardCompactProps {
  budget: Budget;
  progress?: BudgetProgress;
  onClick?: () => void;
}

export function BudgetCardCompact({
  budget,
  progress,
  onClick,
}: BudgetCardCompactProps) {
  const percentageUsed = progress ? progress.percentageUsed : 0;

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: budget.currency || "MXN",
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900 truncate">{budget.name}</h4>
          <BudgetStatusBadge status={budget.status} />
        </div>
        <p className="text-sm text-gray-500 mt-0.5">
          {progress
            ? `${formatCurrency(progress.spentAmount)} de ${formatCurrency(
                budget.totalLimit,
              )}`
            : formatCurrency(budget.totalLimit)}
        </p>
      </div>

      {progress && (
        <div className="flex items-center gap-3">
          <div className="w-24">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  percentageUsed >= 100
                    ? "bg-red-500"
                    : percentageUsed >= 80
                      ? "bg-orange-500"
                      : "bg-green-500",
                )}
                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
              />
            </div>
          </div>
          <span
            className={cn(
              "text-sm font-medium",
              percentageUsed >= 100
                ? "text-red-600"
                : percentageUsed >= 80
                  ? "text-orange-600"
                  : "text-green-600",
            )}
          >
            {percentageUsed.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}
