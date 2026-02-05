"use client";

import React, { useState, useEffect } from "react";
import { useServiceProducts } from "@/lib/hooks/useServiceProducts";
import { ServiceProduct, ProductOption } from "@/lib/hooks/useServiceProducts";

interface ServiceProductsProps {
  serviceId: string;
  onAdd?: (product: ServiceProduct) => void;
  onRemove?: (product: ServiceProduct) => void;
  showActions?: boolean;
}

interface ProductFormData {
  productId: string;
  quantity: number;
}

export function ServiceProducts({
  serviceId,
  onAdd,
  onRemove,
  showActions = true,
}: ServiceProductsProps) {
  const {
    serviceProducts,
    availableProducts,
    loading,
    error,
    loadServiceProducts,
    loadAvailableProducts,
    addProducts,
    removeProduct,
    checkStockAvailability,
  } = useServiceProducts(serviceId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    productId: "",
    quantity: 1,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Verificar disponibilidad de stock para un producto
  const checkProductStock = (productId: string, quantity: number) => {
    const stockInfo = checkStockAvailability();
    const productStock = stockInfo.find((item) => item.productId === productId);
    return productStock ? productStock.hasStock : false;
  };

  // Agregar producto al servicio
  const handleAddProduct = async () => {
    // Validar formulario
    const errors: Record<string, string> = {};
    if (!formData.productId) {
      errors.productId = "El producto es requerido";
    }
    if (formData.quantity <= 0) {
      errors.quantity = "La cantidad debe ser mayor a 0";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Verificar disponibilidad de stock
    const isAvailable = checkProductStock(
      formData.productId,
      formData.quantity,
    );
    if (!isAvailable) {
      setFormErrors({
        productId: "No hay suficiente stock disponible",
      });
      return;
    }

    try {
      await addProducts([formData]);
      setShowAddForm(false);
      setFormData({ productId: "", quantity: 1 });
      setFormErrors({});

      // Notificar al componente padre
      const addedProduct = serviceProducts.find(
        (p) => p.productId === formData.productId,
      );
      if (addedProduct) {
        onAdd?.(addedProduct);
      }
    } catch (err) {
      console.error("Error adding product to service:", err);
    }
  };

  // Eliminar producto del servicio
  const handleRemoveProduct = async (product: ServiceProduct) => {
    if (
      !confirm(
        "¿Estás seguro de que deseas eliminar este producto del servicio?",
      )
    ) {
      return;
    }

    try {
      await removeProduct(product.productId);
      onRemove?.(product);
    } catch (err) {
      console.error("Error removing product from service:", err);
    }
  };

  // Manejar cambios en el formulario
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" ? parseFloat(value) || 1 : value,
    }));

    // Limpiar error del campo modificado
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Cargar productos al inicio
  useEffect(() => {
    loadServiceProducts();
  }, [serviceId, loadServiceProducts]);

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  if (loading && serviceProducts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // Obtener información de stock para mostrar
  const stockInfo = checkStockAvailability();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Productos del Servicio
        </h3>
        {showActions && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {showAddForm ? "Cancelar" : "Agregar Producto"}
          </button>
        )}
      </div>

      {/* Formulario para agregar producto */}
      {showAddForm && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Agregar Producto
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Producto <span className="text-red-500">*</span>
              </label>
              <select
                name="productId"
                value={formData.productId}
                onChange={handleFormChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.productId ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Seleccionar producto</option>
                {availableProducts.map((product: ProductOption) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {formatCurrency(product.unitPrice)} -
                    Stock: {product.currentStock}
                  </option>
                ))}
              </select>
              {formErrors.productId && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.productId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleFormChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.quantity ? "border-red-500" : "border-gray-300"
                }`}
              />
              {formErrors.quantity && (
                <p className="mt-1 text-sm text-red-600">
                  {formErrors.quantity}
                </p>
              )}
            </div>

            <div className="flex items-end">
              <button
                onClick={handleAddProduct}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? "Agregando..." : "Agregar"}
              </button>
            </div>
          </div>

          {/* Indicador de disponibilidad de stock */}
          {formData.productId && (
            <div className="mt-2">
              {checkProductStock(formData.productId, formData.quantity) ? (
                <span className="text-green-600 text-sm">
                  ✓ Stock disponible
                </span>
              ) : (
                <span className="text-red-600 text-sm">
                  ✗ Stock insuficiente
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lista de productos del servicio */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {serviceProducts.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">
              Este servicio no tiene productos asociados.
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado de Stock
                </th>
                {showActions && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {serviceProducts.map((product) => {
                const stockStatus = stockInfo.find(
                  (item) => item.productId === product.productId,
                );
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.productName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {product.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {stockStatus?.hasStock ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Stock Disponible
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Faltan {stockStatus?.deficit || 0} unidades
                        </span>
                      )}
                    </td>
                    {showActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleRemoveProduct(product)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
