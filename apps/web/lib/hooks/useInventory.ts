"use client";

import { useState, useCallback } from "react";

// Tipos para el inventario
export interface InventoryItem {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  productSku: string;
  productImage?: string | null;
  productCategory: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint: number;
  unitPrice: number;
  salePrice: number;
  totalValue: number;
  lastUpdated: Date;
  isActive: boolean;
}

export interface InventoryTransaction {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  type: "deduction" | "addition" | "adjustment" | "initial";
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

export interface InventoryAlert {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  type: "low_stock" | "out_of_stock" | "reorder_point";
  message: string;
  resolved: boolean;
  resolutionNote?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface ServiceProduct {
  id: string;
  tenantId: string;
  serviceId: string;
  serviceName: string;
  productId: string;
  productName: string;
  quantity: number;
  isActive: boolean;
  createdAt: Date;
}

// Tipos para los parámetros de consulta
export interface InventoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
}

export interface TransactionQueryParams {
  page?: number;
  limit?: number;
  productId?: string;
  type?: string;
  referenceType?: string;
  startDate?: string;
  endDate?: string;
}

export interface AlertQueryParams {
  page?: number;
  limit?: number;
  productId?: string;
  type?: string;
  resolved?: boolean;
}

// Hook principal para el inventario
export function useInventory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para manejar errores
  const handleError = useCallback((err: any) => {
    const errorMessage = err?.message || "Error en la operación";
    setError(errorMessage);
    console.error("Inventory error:", err);
  }, []);

  // Función para realizar peticiones a la API
  const apiRequest = useCallback(
    async <T = any>(
      endpoint: string,
      options: RequestInit = {},
    ): Promise<T> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api${endpoint}`, {
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
          ...options,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error en la petición");
        }

        return await response.json();
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  // Obtener inventario
  const getInventory = useCallback(
    async (params: InventoryQueryParams = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      return apiRequest<{
        data: InventoryItem[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(`/inventory?${queryParams.toString()}`);
    },
    [apiRequest],
  );

  // Obtener un item de inventario por ID
  const getInventoryItem = useCallback(
    async (productId: string) => {
      return apiRequest<{ inventory: InventoryItem }>(
        `/inventory/${productId}`,
      );
    },
    [apiRequest],
  );

  // Crear o actualizar inventario
  const upsertInventory = useCallback(
    async (
      productId: string,
      data: {
        quantity?: number;
        reorderPoint?: number;
        unitPrice?: number;
        salePrice?: number;
        isActive?: boolean;
      },
    ) => {
      return apiRequest<{ inventory: InventoryItem }>(
        `/inventory/${productId}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        },
      );
    },
    [apiRequest],
  );

  // Obtener productos asociados a un servicio
  const getServiceProducts = useCallback(
    async (serviceId: string) => {
      return apiRequest<{ relations: ServiceProduct[] }>(
        `/services/${serviceId}/products`,
      );
    },
    [apiRequest],
  );

  // Asociar productos a un servicio
  const addProductsToService = useCallback(
    async (
      serviceId: string,
      products: { productId: string; quantity: number }[],
    ) => {
      return apiRequest<{ relations: ServiceProduct[] }>(
        `/services/${serviceId}/products`,
        {
          method: "POST",
          body: JSON.stringify({ products }),
        },
      );
    },
    [apiRequest],
  );

  // Eliminar producto de un servicio
  const removeProductFromService = useCallback(
    async (serviceId: string, productId: string) => {
      return apiRequest<{ relation: ServiceProduct }>(
        `/services/${serviceId}/products/${productId}`,
        {
          method: "DELETE",
        },
      );
    },
    [apiRequest],
  );

  // Obtener transacciones de inventario
  const getTransactions = useCallback(
    async (params: TransactionQueryParams = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      return apiRequest<{
        data: InventoryTransaction[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(`/inventory/transactions?${queryParams.toString()}`);
    },
    [apiRequest],
  );

  // Obtener alertas de inventario
  const getAlerts = useCallback(
    async (params: AlertQueryParams = {}) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      return apiRequest<{
        data: InventoryAlert[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(`/inventory/alerts?${queryParams.toString()}`);
    },
    [apiRequest],
  );

  // Crear alerta de inventario
  const createAlert = useCallback(
    async (data: {
      productId: string;
      type: "low_stock" | "out_of_stock" | "reorder_point";
      message: string;
    }) => {
      return apiRequest<{ alert: InventoryAlert }>(`/inventory/alerts`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    [apiRequest],
  );

  // Actualizar alerta
  const updateAlert = useCallback(
    async (
      alertId: string,
      data: {
        resolved?: boolean;
        resolutionNote?: string;
      },
    ) => {
      return apiRequest<{ alert: InventoryAlert }>(
        `/inventory/alerts/${alertId}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        },
      );
    },
    [apiRequest],
  );

  // Eliminar alerta
  const deleteAlert = useCallback(
    async (alertId: string) => {
      return apiRequest(`/inventory/alerts/${alertId}`, {
        method: "DELETE",
      });
    },
    [apiRequest],
  );

  // Deducir inventario para un servicio
  const deductInventory = useCallback(
    async (data: {
      serviceId: string;
      products: { productId: string; quantity: number }[];
      notes?: string;
    }) => {
      return apiRequest<{
        transactions: InventoryTransaction[];
        alerts: InventoryAlert[];
      }>(`/inventory/deduct`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    [apiRequest],
  );

  // Generar reporte de inventario
  const generateReport = useCallback(
    async (params: {
      reportType:
        | "low_stock"
        | "stock_value"
        | "movement_summary"
        | "product_performance";
      startDate?: string;
      endDate?: string;
      category?: string;
      format?: "json" | "csv";
    }) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      if (params.format === "csv") {
        // Para CSV, redirigir a la URL de descarga
        const response = await fetch(
          `/api/inventory/reports?${queryParams.toString()}`,
        );
        if (!response.ok) {
          throw new Error("Error al generar reporte");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inventory_${params.reportType}_report_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        return { success: true };
      }

      return apiRequest<{
        reportType: string;
        generatedAt: string;
        data: any;
      }>(`/inventory/reports?${queryParams.toString()}`);
    },
    [apiRequest],
  );

  return {
    loading,
    error,
    getInventory,
    getInventoryItem,
    upsertInventory,
    getServiceProducts,
    addProductsToService,
    removeProductFromService,
    getTransactions,
    getAlerts,
    createAlert,
    updateAlert,
    deleteAlert,
    deductInventory,
    generateReport,
  };
}
