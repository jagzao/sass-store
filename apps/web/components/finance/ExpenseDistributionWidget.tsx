"use client";

import { PieChart, TrendingUp } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryColor?: string;
  amount: number;
  percentage: number;
}

interface ExpenseDistributionWidgetProps {
  spendings: CategorySpending[];
  totalExpense: number;
  className?: string;
}

export function ExpenseDistributionWidget({
  spendings,
  totalExpense,
  className,
}: ExpenseDistributionWidgetProps) {
  // Sort by amount descending and take top 5
  const topSpendings = [...spendings]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate pie chart segments
  const totalPercentage = topSpendings.reduce(
    (sum, s) => sum + s.percentage,
    0,
  );
  const otherPercentage = 100 - totalPercentage;

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-200 p-6",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <PieChart className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Distribución de Gastos
        </h3>
      </div>

      {topSpendings.length > 0 ? (
        <div className="space-y-4">
          {/* Top spending categories */}
          {topSpendings.map((spending, index) => (
            <div key={spending.categoryId}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: spending.categoryColor || "#6B7280",
                    }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {spending.categoryName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(spending.amount)}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({spending.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <ProgressBar
                value={spending.percentage}
                max={100}
                size="sm"
                color={spending.categoryColor}
                showLabel={false}
              />
            </div>
          ))}

          {/* Others category if there are more spendings */}
          {otherPercentage > 0 && spendings.length > 5 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                  <span className="text-sm font-medium text-gray-700">
                    Otros
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  ({otherPercentage.toFixed(1)}%)
                </span>
              </div>
              <ProgressBar
                value={otherPercentage}
                max={100}
                size="sm"
                color="#D1D5DB"
                showLabel={false}
              />
            </div>
          )}

          {/* Total */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Total de gastos
              </span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(totalExpense)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hay gastos registrados</p>
          <p className="text-xs text-gray-400 mt-1">
            Los gastos aparecerán aquí cuando los registres
          </p>
        </div>
      )}
    </div>
  );
}
