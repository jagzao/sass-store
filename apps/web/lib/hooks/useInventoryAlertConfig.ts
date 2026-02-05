"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

export interface InventoryAlertConfig {
  id: string;
  tenantId: string;
  productId: string;
  minStock: number;
  maxStock: number;
  lowStockThreshold: number;
  highStockThreshold: number;
  expirationDays?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface CreateAlertConfigData {
  productId: string;
  minStock: number;
  maxStock: number;
  lowStockThreshold: number;
  highStockThreshold: number;
  expirationDays?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateAlertConfigData {
  minStock?: number;
  maxStock?: number;
  lowStockThreshold?: number;
  highStockThreshold?: number;
  expirationDays?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface UseInventoryAlertConfigOptions {
  autoFetch?: boolean;
  productId?: string;
  isActive?: boolean;
}

export function useInventoryAlertConfig(
  options: UseInventoryAlertConfigOptions = {},
) {
  const { autoFetch = true, productId, isActive } = options;
  const [configs, setConfigs] = useState<InventoryAlertConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInventoryAlertConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let url = "/api/inventory/alert-config";
      const params = new URLSearchParams();

      if (productId) params.append("productId", productId);
      if (isActive !== undefined)
        params.append("isActive", isActive.toString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          "Error al obtener configuraciones de alertas de inventario",
        );
      }

      const data = await response.json();
      setConfigs(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [productId, isActive, toast]);

  const createInventoryAlertConfig = useCallback(
    async (data: CreateAlertConfigData) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/inventory/alert-config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              "Error al crear configuración de alerta de inventario",
          );
        }

        const newConfig = await response.json();
        setConfigs((prev) => [...prev, newConfig]);

        toast({
          title: "Éxito",
          description:
            "Configuración de alerta de inventario creada correctamente",
        });

        return newConfig;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  const updateInventoryAlertConfig = useCallback(
    async (id: string, data: UpdateAlertConfigData) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/inventory/alert-config/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              "Error al actualizar configuración de alerta de inventario",
          );
        }

        const updatedConfig = await response.json();
        setConfigs((prev) =>
          prev.map((config) => (config.id === id ? updatedConfig : config)),
        );

        toast({
          title: "Éxito",
          description:
            "Configuración de alerta de inventario actualizada correctamente",
        });

        return updatedConfig;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  const deleteInventoryAlertConfig = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/inventory/alert-config/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              "Error al eliminar configuración de alerta de inventario",
          );
        }

        setConfigs((prev) => prev.filter((config) => config.id !== id));

        toast({
          title: "Éxito",
          description:
            "Configuración de alerta de inventario eliminada correctamente",
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  const getInventoryAlertConfigById = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/inventory/alert-config/${id}`);

        if (!response.ok) {
          throw new Error(
            "Error al obtener configuración de alerta de inventario",
          );
        }

        const config = await response.json();
        return config;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  // Cargar configuraciones automáticamente si autoFetch es true
  if (autoFetch && configs.length === 0 && !loading && !error) {
    fetchInventoryAlertConfigs();
  }

  return {
    configs,
    loading,
    error,
    fetchInventoryAlertConfigs,
    createInventoryAlertConfig,
    updateInventoryAlertConfig,
    deleteInventoryAlertConfig,
    getInventoryAlertConfigById,
  };
}
