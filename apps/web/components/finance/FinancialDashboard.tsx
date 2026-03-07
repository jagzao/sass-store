"use client";

import { useRouter } from "next/navigation";
import { MonthlySummaryWidget } from "./MonthlySummaryWidget";
import { ActiveBudgetsWidget } from "./ActiveBudgetsWidget";
import { ExpenseDistributionWidget } from "./ExpenseDistributionWidget";
import { SupplyExpenseWidget } from "./SupplyExpenseWidget";
import { QuickActions } from "./QuickActions";
import { useActiveBudgets } from "@/hooks/useBudgets";
import { useCurrentMonthSupplyExpenses } from "@/hooks/useSupplyExpenses";
import type { Budget, BudgetProgress } from "@/lib/api/budgets";

interface FinancialDashboardProps {
  tenantId: string;
  tenantSlug: string;
  // Mock data for demo purposes - in production, these would come from APIs
  monthlyIncome?: number;
  monthlyExpense?: number;
  previousMonthIncome?: number;
  previousMonthExpense?: number;
  expenseByCategory?: Array<{
    categoryId: string;
    categoryName: string;
    categoryColor?: string;
    amount: number;
    percentage: number;
  }>;
}

export function FinancialDashboard({
  tenantId,
  tenantSlug,
  monthlyIncome,
  monthlyExpense,
  previousMonthIncome,
  previousMonthExpense,
  expenseByCategory = [],
}: FinancialDashboardProps) {
  const router = useRouter();

  const { data: budgets } = useActiveBudgets(tenantId);
  const { totalCost, productCount, report } =
    useCurrentMonthSupplyExpenses(tenantId);

  // Transform budgets for the widget
  const budgetsWithProgress: Array<{
    budget: Budget;
    progress?: BudgetProgress;
  }> =
    budgets?.map((budget) => ({
      budget,
      // Mock progress - in production this would come from API
      progress: {
        budgetId: budget.id,
        tenantId: budget.tenantId,
        budgetName: budget.name,
        periodType: budget.periodType,
        startDate: budget.startDate,
        endDate: budget.endDate,
        totalLimit: budget.totalLimit,
        status: budget.status,
        alertThreshold: budget.alertThreshold,
        rolloverEnabled: budget.rolloverEnabled,
        spentAmount: (parseFloat(budget.totalLimit) * 0.75).toFixed(2),
        remaining: (parseFloat(budget.totalLimit) * 0.25).toFixed(2),
        percentageUsed: 75,
        alertTriggered: budget.alertThreshold <= 75,
        transactionCount: 12,
      },
    })) || [];

  const handleNavigate = (path: string) => {
    router.push(`/t/${tenantSlug}${path}`);
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <QuickActions
        onAddIncome={() => handleNavigate("/finance/movements?type=income")}
        onAddExpense={() => handleNavigate("/finance/movements?type=expense")}
        onCreateBudget={() => handleNavigate("/finance/budgets")}
        onViewSupplies={() => handleNavigate("/inventory/supplies")}
      />

      {/* Monthly Summary */}
      <MonthlySummaryWidget
        income={monthlyIncome}
        expense={monthlyExpense}
        previousMonthIncome={previousMonthIncome}
        previousMonthExpense={previousMonthExpense}
      />

      {/* Grid for Budgets and Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Budgets */}
        <ActiveBudgetsWidget
          budgets={budgetsWithProgress}
          onViewAll={() => handleNavigate("/finance/budgets")}
          onBudgetClick={(budgetId) =>
            handleNavigate(`/finance/budgets/${budgetId}`)
          }
        />

        {/* Expense Distribution */}
        <ExpenseDistributionWidget
          spendings={expenseByCategory}
          totalExpense={monthlyExpense}
        />
      </div>

      {/* Supply Expenses */}
      <SupplyExpenseWidget
        totalCost={parseFloat(totalCost)}
        productCount={productCount}
        transactionCount={report?.totals?.totalTransactions || 0}
        onViewDetails={() => handleNavigate("/inventory/supplies")}
      />
    </div>
  );
}
