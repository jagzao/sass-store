"use client";

import { Plus, Wallet, PiggyBank, Package, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  color: string;
  bgColor: string;
}

interface QuickActionsProps {
  onAddIncome?: () => void;
  onAddExpense?: () => void;
  onCreateBudget?: () => void;
  onViewSupplies?: () => void;
  className?: string;
}

export function QuickActions({
  onAddIncome,
  onAddExpense,
  onCreateBudget,
  onViewSupplies,
  className,
}: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      icon: <Plus className="w-5 h-5" />,
      label: "Registrar Ingreso",
      description: "Añade un nuevo ingreso",
      onClick: onAddIncome || (() => {}),
      color: "text-green-600",
      bgColor: "bg-green-50 hover:bg-green-100",
    },
    {
      icon: <Wallet className="w-5 h-5" />,
      label: "Registrar Gasto",
      description: "Añade un nuevo gasto",
      onClick: onAddExpense || (() => {}),
      color: "text-red-600",
      bgColor: "bg-red-50 hover:bg-red-100",
    },
    {
      icon: <PiggyBank className="w-5 h-5" />,
      label: "Crear Presupuesto",
      description: "Define un nuevo presupuesto",
      onClick: onCreateBudget || (() => {}),
      color: "text-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100",
    },
    {
      icon: <Package className="w-5 h-5" />,
      label: "Ver Insumos",
      description: "Revisa gastos de insumos",
      onClick: onViewSupplies || (() => {}),
      color: "text-purple-600",
      bgColor: "bg-purple-50 hover:bg-purple-100",
    },
  ];

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-200 p-6",
        className,
      )}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Acciones Rápidas
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={cn(
              "flex items-start gap-3 p-4 rounded-lg border border-transparent transition-all text-left",
              action.bgColor,
              "hover:border-gray-200 hover:shadow-sm",
            )}
          >
            <div className={cn("mt-0.5", action.color)}>{action.icon}</div>
            <div className="flex-1 min-w-0">
              <p className={cn("font-medium text-sm", action.color)}>
                {action.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {action.description}
              </p>
            </div>
            <ArrowRight className={cn("w-4 h-4 self-center", action.color)} />
          </button>
        ))}
      </div>
    </div>
  );
}
