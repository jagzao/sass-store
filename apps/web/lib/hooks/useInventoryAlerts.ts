"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

export interface InventoryAlert {
  id: string;
  tenantId: string;
  productId: string;
  alertType: string;
  message: string;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  acknowledgedNotes?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface AcknowledgeAlertData {
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedNotes?: string;
}

export interface UseInventoryAlertsOptions {
  autoFetch?: boolean;
  productId?: string;
  alertType?: string;
  isAcknowledged?: boolean;
}

export function useInventoryAlerts(options: UseInventoryAlertsOptions = {}) {
  const { autoFetch = true, productId, alertType, isAcknowledged } = options;
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInventoryAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let url = "/api/inventory/alerts";
      const params = new URLSearchParams();

      if (productId) params.append("productId", productId);
      if (alertType) params.append("alertType", alertType);
      if (isAcknowledged !== undefined)
        params.append("isAcknowledged", isAcknowledged.toString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Error al obtener alertas de inventario");
      }

      const data = await response.json();
      setAlerts(data);
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
  }, [productId, alertType, isAcknowledged, toast]);

  const acknowledgeInventoryAlert = useCallback(
    async (id: string, data: AcknowledgeAlertData) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/inventory/alerts/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Error al actualizar alerta de inventario",
          );
        }

        const updatedAlert = await response.json();
        setAlerts((prev) =>
          prev.map((alert) => (alert.id === id ? updatedAlert : alert)),
        );

        toast({
          title: "Éxito",
          description: "Alerta de inventario actualizada correctamente",
        });

        return updatedAlert;
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

  const getInventoryAlertById = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/inventory/alerts/${id}`);

        if (!response.ok) {
          throw new Error("Error al obtener alerta de inventario");
        }

        const alert = await response.json();
        return alert;
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

  // Cargar alertas automáticamente si autoFetch es true
  if (autoFetch && alerts.length === 0 && !loading && !error) {
    fetchInventoryAlerts();
  }

  return {
    alerts,
    loading,
    error,
    fetchInventoryAlerts,
    acknowledgeInventoryAlert,
    getInventoryAlertById,
  };
}
