"use client";

import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthlySummaryWidgetProps {
  income: number;
  expense: number;
  previousMonthIncome?: number;
  previousMonthExpense?: number;
  className?: string;
}

export function MonthlySummaryWidget({
  income,
  expense,
  previousMonthIncome,
  previousMonthExpense,
  className,
}: MonthlySummaryWidgetProps) {
  const balance = income - expense;
  const previousBalance =
    (previousMonthIncome || 0) - (previousMonthExpense || 0);

  const incomeChange = previousMonthIncome
    ? ((income - previousMonthIncome) / previousMonthIncome) * 100
    : 0;
  const expenseChange = previousMonthExpense
    ? ((expense - previousMonthExpense) / previousMonthExpense) * 100
    : 0;
  const balanceChange = previousBalance
    ? ((balance - previousBalance) / Math.abs(previousBalance)) * 100
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      label: "Ingresos",
      value: income,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: incomeChange,
    },
    {
      label: "Gastos",
      value: expense,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
      change: expenseChange,
    },
    {
      label: "Balance",
      value: balance,
      icon: Wallet,
      color: balance >= 0 ? "text-blue-600" : "text-orange-600",
      bgColor: balance >= 0 ? "bg-blue-50" : "bg-orange-50",
      change: balanceChange,
      isBalance: true,
    },
  ];

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-200 p-6",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Resumen del Mes</h3>
        <span className="text-sm text-gray-500">
          {new Date().toLocaleDateString("es-MX", {
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3",
                stat.bgColor,
              )}
            >
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <p className={cn("text-2xl font-bold", stat.color)}>
              {formatCurrency(stat.value)}
            </p>
            {stat.change !== 0 && (
              <div
                className={cn(
                  "flex items-center justify-center gap-1 mt-2 text-xs",
                  stat.change > 0 ? "text-green-600" : "text-red-600",
                )}
              >
                {stat.change > 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                <span>{Math.abs(stat.change).toFixed(1)}% vs mes anterior</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
