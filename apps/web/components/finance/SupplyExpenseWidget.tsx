"use client";

import { Package, ArrowRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SupplyExpenseWidgetProps {
  totalCost: number;
  productCount: number;
  transactionCount: number;
  previousMonthCost?: number;
  onViewDetails?: () => void;
  className?: string;
}

export function SupplyExpenseWidget({
  totalCost,
  productCount,
  transactionCount,
  previousMonthCost,
  onViewDetails,
  className,
}: SupplyExpenseWidgetProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const change = previousMonthCost
    ? ((totalCost - previousMonthCost) / previousMonthCost) * 100
    : 0;

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
          <Package className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Gastos en Insumos
          </h3>
        </div>
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 transition-colors"
          >
            Ver detalle
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Stats */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">
            {formatCurrency(totalCost)}
          </span>
          {change !== 0 && (
            <span
              className={cn(
                "text-sm font-medium",
                change > 0 ? "text-red-600" : "text-green-600",
              )}
            >
              {change > 0 ? "+" : ""}
              {change.toFixed(1)}% vs mes anterior
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">Total gastado este mes</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Package className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Productos</span>
          </div>
          <p className="text-xl font-semibold text-gray-900">{productCount}</p>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Transacciones</span>
          </div>
          <p className="text-xl font-semibold text-gray-900">
            {transactionCount}
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-purple-50 rounded-lg">
        <p className="text-xs text-purple-700">
          Los productos marcados como &quot;insumos&quot; generan gastos
          automáticamente al registrar compras en inventario.
        </p>
      </div>
    </div>
  );
}
