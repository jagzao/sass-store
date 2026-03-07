"use client";

import { useState } from "react";
import { Package, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/api/categories";

interface ProductSupplyToggleProps {
  productId: string;
  productName: string;
  isSupply: boolean;
  expenseCategoryId?: string;
  autoCreateExpense?: boolean;
  categories: Category[];
  onToggle: (isSupply: boolean) => void;
  onCategoryChange: (categoryId: string | null) => void;
  onAutoCreateChange: (autoCreate: boolean) => void;
  isLoading?: boolean;
}

export function ProductSupplyToggle({
  productName,
  isSupply,
  expenseCategoryId,
  autoCreateExpense = true,
  categories,
  onToggle,
  onCategoryChange,
  onAutoCreateChange,
  isLoading = false,
}: ProductSupplyToggleProps) {
  const [showDetails, setShowDetails] = useState(isSupply);

  const expenseCategories = categories.filter((cat) => cat.type === "expense");

  const handleToggle = (checked: boolean) => {
    setShowDetails(checked);
    onToggle(checked);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Toggle Principal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              isSupply ? "bg-purple-100" : "bg-gray-100",
            )}
          >
            <Package
              className={cn(
                "w-5 h-5 transition-colors",
                isSupply ? "text-purple-600" : "text-gray-400",
              )}
            />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Marcar como insumo</h4>
            <p className="text-sm text-gray-500">
              Las compras de este producto generarán gastos automáticamente
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isSupply}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={isLoading}
            className="sr-only peer"
          />
          <div
            className={cn(
              "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer transition-all",
              "peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px]",
              "after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all",
              isSupply && "bg-purple-600",
            )}
          ></div>
        </label>
      </div>

      {/* Opciones adicionales (solo si es insumo) */}
      {showDetails && (
        <div className="pt-4 border-t border-gray-200 space-y-4 animate-in slide-in-from-top-2">
          {/* Categoría de gasto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría de gasto
            </label>
            <select
              value={expenseCategoryId || ""}
              onChange={(e) => onCategoryChange(e.target.value || null)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Seleccionar categoría...</option>
              {expenseCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              El gasto se categorizará automáticamente
            </p>
          </div>

          {/* Crear gasto automáticamente */}
          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
            <input
              type="checkbox"
              id="auto-create-expense"
              checked={autoCreateExpense}
              onChange={(e) => onAutoCreateChange(e.target.checked)}
              disabled={isLoading}
              className="mt-0.5 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <div>
              <label
                htmlFor="auto-create-expense"
                className="font-medium text-purple-900 cursor-pointer"
              >
                Crear gasto automáticamente
              </label>
              <p className="text-sm text-purple-700 mt-0.5">
                Al registrar una compra en inventario, se creará un gasto
                automáticamente
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-700 mb-2">
              Vista previa del gasto:
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-green-500" />
              <span>
                Compra: {productName} → Gasto automático
                {expenseCategoryId &&
                  ` en "${
                    expenseCategories.find((c) => c.id === expenseCategoryId)
                      ?.name || "categoría seleccionada"
                  }"`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Versión compacta para usar en tablas
interface SupplyBadgeProps {
  isSupply: boolean;
  className?: string;
}

export function SupplyBadge({ isSupply, className }: SupplyBadgeProps) {
  if (!isSupply) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full",
        className,
      )}
    >
      <Package className="w-3 h-3" />
      Insumo
    </span>
  );
}
