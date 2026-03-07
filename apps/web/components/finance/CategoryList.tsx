"use client";

import { Pencil, Trash2, Lock, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/api/categories";

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
  isDeleting?: string | null;
}

export function CategoryList({
  categories,
  onEdit,
  onDelete,
  isDeleting,
}: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="text-gray-500">No hay categorías para mostrar</p>
        <p className="text-sm text-gray-400 mt-1">
          Crea tu primera categoría para comenzar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {categories.map((category) => {
        const Icon = require("lucide-react")[category.icon || "Circle"];

        return (
          <div
            key={category.id}
            className={cn(
              "group flex items-center gap-3 p-4 bg-white rounded-lg border transition-all",
              "hover:shadow-md hover:border-gray-300",
              category.isDefault && "bg-gray-50/50",
            )}
          >
            {/* Drag handle */}
            <div className="cursor-move text-gray-400 hover:text-gray-600">
              <GripVertical className="w-4 h-4" />
            </div>

            {/* Icon & Color */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: category.color || "#3B82F6" }}
            >
              {Icon && <Icon className="w-5 h-5 text-white" />}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900 truncate">
                  {category.name}
                </h3>
                {category.isDefault && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                    <Lock className="w-3 h-3" />
                    Por defecto
                  </span>
                )}
              </div>
              {category.description && (
                <p className="text-sm text-gray-500 truncate mt-0.5">
                  {category.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1">
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    category.type === "income"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700",
                  )}
                >
                  {category.type === "income" ? "Ingreso" : "Gasto"}
                </span>
                {category.isFixed && category.type === "expense" && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    Fijo
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(category)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              {!category.isDefault && (
                <button
                  onClick={() => onDelete(category.id)}
                  disabled={isDeleting === category.id}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Versión compacta para usar en selects o dropdowns
interface CategoryItemProps {
  category: Category;
  showType?: boolean;
  className?: string;
}

export function CategoryItem({
  category,
  showType = false,
  className,
}: CategoryItemProps) {
  const Icon = require("lucide-react")[category.icon || "Circle"];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center"
        style={{ backgroundColor: category.color || "#3B82F6" }}
      >
        {Icon && <Icon className="w-3 h-3 text-white" />}
      </div>
      <span className="text-sm font-medium text-gray-900">{category.name}</span>
      {showType && (
        <span
          className={cn(
            "text-xs px-1.5 py-0.5 rounded",
            category.type === "income"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700",
          )}
        >
          {category.type === "income" ? "Ingreso" : "Gasto"}
        </span>
      )}
    </div>
  );
}
