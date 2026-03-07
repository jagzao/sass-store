"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  BudgetPeriodType,
  BudgetStatus,
  CreateBudgetData,
  UpdateBudgetData,
} from "@/lib/api/budgets";

interface BudgetFormProps {
  initialData?: {
    id?: string;
    name: string;
    periodType: BudgetPeriodType;
    startDate: string;
    endDate: string;
    totalLimit: string;
    currency: string;
    status: BudgetStatus;
    rolloverEnabled: boolean;
    alertThreshold: number;
    notes?: string;
  };
  onSubmit: (data: CreateBudgetData | UpdateBudgetData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BudgetForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: BudgetFormProps) {
  const isEditing = !!initialData?.id;

  // Calculate default dates
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    periodType: initialData?.periodType || "monthly",
    startDate:
      initialData?.startDate || firstDayOfMonth.toISOString().split("T")[0],
    endDate: initialData?.endDate || lastDayOfMonth.toISOString().split("T")[0],
    totalLimit: initialData?.totalLimit || "",
    currency: initialData?.currency || "MXN",
    rolloverEnabled: initialData?.rolloverEnabled ?? false,
    alertThreshold: initialData?.alertThreshold || 80,
    notes: initialData?.notes || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-calculate end date based on period type
  useEffect(() => {
    if (!isEditing && formData.startDate) {
      const start = new Date(formData.startDate);
      let end = new Date(start);

      switch (formData.periodType) {
        case "weekly":
          end.setDate(start.getDate() + 6);
          break;
        case "biweekly":
          end.setDate(start.getDate() + 13);
          break;
        case "monthly":
          end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
          break;
      }

      setFormData((prev) => ({
        ...prev,
        endDate: end.toISOString().split("T")[0],
      }));
    }
  }, [formData.startDate, formData.periodType, isEditing]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (!formData.totalLimit || parseFloat(formData.totalLimit) <= 0) {
      newErrors.totalLimit = "El límite debe ser mayor a 0";
    }

    if (!formData.startDate) {
      newErrors.startDate = "La fecha de inicio es requerida";
    }

    if (!formData.endDate) {
      newErrors.endDate = "La fecha de fin es requerida";
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        newErrors.endDate =
          "La fecha de fin debe ser posterior a la fecha de inicio";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const data: CreateBudgetData | UpdateBudgetData = {
      ...formData,
      name: formData.name.trim(),
      notes: formData.notes.trim() || undefined,
    };

    onSubmit(data);
  };

  const handleChange = (
    field: keyof typeof formData,
    value: string | boolean | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? "Editar Presupuesto" : "Nuevo Presupuesto"}
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del presupuesto *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Ej: Presupuesto Marzo 2026"
              className={cn(
                "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.name ? "border-red-500" : "border-gray-300",
              )}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Period Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de período *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: "weekly", label: "Semanal" },
                { value: "biweekly", label: "Quincenal" },
                { value: "monthly", label: "Mensual" },
                { value: "custom", label: "Personalizado" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange("periodType", option.value)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg border transition-colors",
                    formData.periodType === option.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de inicio *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                  className={cn(
                    "w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.startDate ? "border-red-500" : "border-gray-300",
                  )}
                />
              </div>
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de fin *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                  className={cn(
                    "w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                    errors.endDate ? "border-red-500" : "border-gray-300",
                  )}
                />
              </div>
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Total Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Límite total *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.totalLimit}
                onChange={(e) => handleChange("totalLimit", e.target.value)}
                placeholder="0.00"
                className={cn(
                  "w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.totalLimit ? "border-red-500" : "border-gray-300",
                )}
              />
            </div>
            {errors.totalLimit && (
              <p className="mt-1 text-sm text-red-600">{errors.totalLimit}</p>
            )}
          </div>

          {/* Alert Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Umbral de alerta: {formData.alertThreshold}%
            </label>
            <input
              type="range"
              min="50"
              max="100"
              value={formData.alertThreshold}
              onChange={(e) =>
                handleChange("alertThreshold", parseInt(e.target.value))
              }
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Se mostrará una alerta cuando el gasto alcance este porcentaje del
              presupuesto
            </p>
          </div>

          {/* Rollover Toggle */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="rollover"
              checked={formData.rolloverEnabled}
              onChange={(e) =>
                handleChange("rolloverEnabled", e.target.checked)
              }
              className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <label
                htmlFor="rollover"
                className="font-medium text-gray-700 cursor-pointer"
              >
                Habilitar rollover (acumulación)
              </label>
              <p className="text-sm text-gray-500 mt-1">
                El saldo sobrante se acumulará al siguiente período
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Notas adicionales sobre el presupuesto..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Summary */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">Resumen</span>
            </div>
            <div className="space-y-1 text-sm text-blue-800">
              <p>
                <span className="font-medium">Período:</span>{" "}
                {new Date(formData.startDate).toLocaleDateString("es-MX")} -{" "}
                {new Date(formData.endDate).toLocaleDateString("es-MX")}
              </p>
              <p>
                <span className="font-medium">Límite:</span>{" "}
                {formData.totalLimit
                  ? new Intl.NumberFormat("es-MX", {
                      style: "currency",
                      currency: formData.currency,
                    }).format(parseFloat(formData.totalLimit))
                  : "$0.00"}
              </p>
              <p>
                <span className="font-medium">Alerta al:</span>{" "}
                {formData.alertThreshold}%
              </p>
            </div>
          </div>

          {/* Buttons */}
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
                  ? "Actualizar Presupuesto"
                  : "Crear Presupuesto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
