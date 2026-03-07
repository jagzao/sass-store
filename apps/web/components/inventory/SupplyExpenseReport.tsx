"use client";

import { useState, useMemo } from "react";
import {
  Package,
  TrendingUp,
  Calendar,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { useSupplyExpenseReport } from "@/hooks/useSupplyExpenses";
import { useCategories } from "@/hooks/useCategories";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

interface SupplyExpenseReportProps {
  tenantId: string;
}

export function SupplyExpenseReport({ tenantId }: SupplyExpenseReportProps) {
  const [dateRange, setDateRange] = useState<
    "month" | "quarter" | "year" | "custom"
  >("month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Calculate default dates
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const effectiveStartDate =
    dateRange === "custom"
      ? startDate
      : firstDayOfMonth.toISOString().split("T")[0];
  const effectiveEndDate =
    dateRange === "custom"
      ? endDate
      : lastDayOfMonth.toISOString().split("T")[0];

  const { data: report, isLoading } = useSupplyExpenseReport(
    tenantId,
    effectiveStartDate,
    effectiveEndDate,
  );

  const { data: categories } = useCategories(tenantId);

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(parseFloat(amount));
  };

  // Group by category
  const categoryBreakdown = useMemo(() => {
    if (!report?.summary) return [];

    const breakdown = new Map<
      string,
      { name: string; total: number; count: number }
    >();

    report.summary.forEach((item) => {
      const categoryName = item.categoryName || "Sin categoría";
      const existing = breakdown.get(categoryName);
      if (existing) {
        existing.total += parseFloat(item.totalCost);
        existing.count += item.transactionCount;
      } else {
        breakdown.set(categoryName, {
          name: categoryName,
          total: parseFloat(item.totalCost),
          count: item.transactionCount,
        });
      }
    });

    return Array.from(breakdown.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [report]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const totals = report?.totals;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reporte de Gastos de Insumos
          </h1>
          <p className="text-gray-500 mt-1">
            Seguimiento de gastos generados por compras de insumos
          </p>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="month">Este mes</option>
            <option value="quarter">Este trimestre</option>
            <option value="year">Este año</option>
            <option value="custom">Personalizado</option>
          </select>

          {dateRange === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-gray-500">a</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium">Total Gastado</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {totals ? formatCurrency(totals.totalCost) : "$0.00"}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Package className="w-5 h-5" />
            <span className="text-sm font-medium">Productos</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {totals?.productCount || 0}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <ShoppingCart className="w-5 h-5" />
            <span className="text-sm font-medium">Transacciones</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {totals?.totalTransactions || 0}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-orange-600 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">Cantidad Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {totals ? parseFloat(totals.totalQuantity).toFixed(0) : "0"}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución por Categoría
          </h3>
          <div className="space-y-4">
            {categoryBreakdown.map((category) => {
              const totalAmount = parseFloat(totals?.totalCost || "0");
              const percentage =
                totalAmount > 0 ? (category.total / totalAmount) * 100 : 0;

              return (
                <div key={category.name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {category.name}
                    </span>
                    <span className="text-sm text-gray-900">
                      {formatCurrency(category.total.toFixed(2))} (
                      {percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <ProgressBar
                    value={percentage}
                    max={100}
                    size="sm"
                    showLabel={false}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Detalle por Producto
          </h3>
        </div>

        {report?.summary && report.summary.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transacciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {report.summary.map((item) => (
                  <tr key={item.productId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                          <Package className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.productName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.productId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {item.categoryName || "Sin categoría"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {parseFloat(item.totalQuantity).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.totalCost)}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                        {item.transactionCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              No hay gastos de insumos en este período
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Las compras de productos marcados como insumos aparecerán aquí
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
