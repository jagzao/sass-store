"use client";

import React, { useState, useEffect } from "react";
import { useInventory } from "@/lib/hooks/useInventory";
import { InventoryItem } from "@/lib/hooks/useInventory";

interface InventoryFormProps {
  item?: InventoryItem;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  productId: string;
  quantity: number;
  reorderPoint: number;
  unitPrice: number;
  isActive: boolean;
}

export function InventoryForm({
  item,
  onSuccess,
  onCancel,
}: InventoryFormProps) {
  const { upsertInventory, loading, error } = useInventory();

  const [formData, setFormData] = useState<FormData>({
    productId: "",
    quantity: 0,
    reorderPoint: 5,
    unitPrice: 0,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicializar formulario con datos del item si existe
  useEffect(() => {
    if (item) {
      setFormData({
        productId: item.productId,
        quantity: item.quantity,
        reorderPoint: item.reorderPoint,
        unitPrice: item.unitPrice,
        isActive: item.isActive,
      });
    }
  }, [item]);

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.productId) {
      newErrors.productId = "El producto es requerido";
    }

    if (formData.quantity < 0) {
      newErrors.quantity = "La cantidad no puede ser negativa";
    }

    if (formData.unitPrice < 0) {
      newErrors.unitPrice = "El precio unitario no puede ser negativo";
    }

    if (formData.reorderPoint < 0) {
      newErrors.reorderPoint = "El punto de reorden no puede ser negativo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en el formulario
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    const newValue =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : name.includes("Price") ||
            name.includes("Quantity") ||
            name.includes("Point")
          ? parseFloat(value) || 0
          : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Limpiar error del campo modificado
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Usar upsertInventory para crear o actualizar
      await upsertInventory(formData.productId, {
        quantity: formData.quantity,
        reorderPoint: formData.reorderPoint,
        unitPrice: formData.unitPrice,
        isActive: formData.isActive,
      });

      onSuccess?.();
    } catch (err) {
      console.error("Error saving inventory:", err);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">
        {item ? "Editar Inventario" : "Nuevo Inventario"}
      </h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Producto <span className="text-red-500">*</span>
            </label>
            <select
              name="productId"
              value={formData.productId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.productId ? "border-red-500" : "border-gray-300"
              }`}
              disabled={!!item}
            >
              <option value="">Seleccionar producto</option>
              <option value="product_1">Producto 1</option>
              <option value="product_2">Producto 2</option>
              <option value="product_3">Producto 3</option>
              {/* Aquí deberías cargar los productos desde la API */}
            </select>
            {errors.productId && (
              <p className="mt-1 text-sm text-red-600">{errors.productId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio Unitario <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`pl-7 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.unitPrice ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>
            {errors.unitPrice && (
              <p className="mt-1 text-sm text-red-600">{errors.unitPrice}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad Total <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.quantity ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Punto de Reorden <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="reorderPoint"
              value={formData.reorderPoint}
              onChange={handleChange}
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.reorderPoint ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.reorderPoint && (
              <p className="mt-1 text-sm text-red-600">{errors.reorderPoint}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Activo</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Guardando...
              </span>
            ) : item ? (
              "Actualizar"
            ) : (
              "Crear"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
