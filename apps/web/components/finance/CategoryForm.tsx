"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ColorPicker } from "@/components/ui/color-picker";
import { IconSelector } from "@/components/ui/icon-selector";
import { cn } from "@/lib/utils";
import type {
  CreateCategoryData,
  UpdateCategoryData,
} from "@/lib/api/categories";

interface CategoryFormProps {
  initialData?: {
    id?: string;
    type: "income" | "expense";
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    isFixed?: boolean;
    budgetAlertThreshold?: number;
    sortOrder?: number;
  };
  onSubmit: (data: CreateCategoryData | UpdateCategoryData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CategoryForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: CategoryFormProps) {
  const isEditing = !!initialData?.id;

  const [formData, setFormData] = useState({
    type: initialData?.type || "expense",
    name: initialData?.name || "",
    description: initialData?.description || "",
    color: initialData?.color || "#3B82F6",
    icon: initialData?.icon || "Wallet",
    isFixed: initialData?.isFixed || false,
    budgetAlertThreshold: initialData?.budgetAlertThreshold || 80,
    sortOrder: initialData?.sortOrder || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    } else if (formData.name.length > 50) {
      newErrors.name = "El nombre no puede exceder 50 caracteres";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "La descripción no puede exceder 500 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const data: CreateCategoryData | UpdateCategoryData = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
    };

    onSubmit(data);
  };

  const handleChange = (
    field: keyof typeof formData,
    value: string | boolean | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? "Editar Categoría" : "Nueva Categoría"}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={formData.type === "income"}
                  onChange={(e) => handleChange("type", e.target.value)}
                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                  disabled={isEditing}
                />
                <span className="text-sm text-gray-700">Ingreso</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={formData.type === "expense"}
                  onChange={(e) => handleChange("type", e.target.value)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                  disabled={isEditing}
                />
                <span className="text-sm text-gray-700">Gasto</span>
              </label>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Ej: Alimentación, Salario, etc."
              className={cn(
                "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.name ? "border-red-500" : "border-gray-300",
              )}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Descripción opcional de la categoría"
              rows={3}
              className={cn(
                "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none",
                errors.description ? "border-red-500" : "border-gray-300",
              )}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Color e Icono */}
          <div className="grid grid-cols-2 gap-4">
            <ColorPicker
              value={formData.color}
              onChange={(color) => handleChange("color", color)}
            />
            <IconSelector
              value={formData.icon}
              onChange={(icon) => handleChange("icon", icon)}
            />
          </div>

          {/* Opciones adicionales */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Es gasto fijo */}
            {formData.type === "expense" && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFixed}
                  onChange={(e) => handleChange("isFixed", e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Es un gasto fijo (recurrente)
                </span>
              </label>
            )}

            {/* Umbral de alerta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Umbral de alerta para presupuestos:{" "}
                {formData.budgetAlertThreshold}%
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={formData.budgetAlertThreshold}
                onChange={(e) =>
                  handleChange("budgetAlertThreshold", parseInt(e.target.value))
                }
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Se mostrará una alerta cuando el gasto en esta categoría alcance
                este porcentaje del presupuesto
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Vista previa:
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: formData.color }}
              >
                {(() => {
                  const Icon = require("lucide-react")[formData.icon];
                  return Icon ? <Icon className="w-5 h-5 text-white" /> : null;
                })()}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {formData.name || "Nombre de categoría"}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {formData.type === "income" ? "Ingreso" : "Gasto"}
                  {formData.isFixed && formData.type === "expense" && " • Fijo"}
                </p>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? "Guardando..."
                : isEditing
                  ? "Actualizar"
                  : "Crear Categoría"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
